'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useStoryStore } from '@/store/useStoryStore'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  generateStory,
  continueStory,
} from '@/lib/storyGenerator'
import { READABILITY_LEVELS } from '@/lib/constants'
import { ImageGenerator } from '@/lib/imageGeneration/imageGenerator'
import { StoryDownload } from '@/components/StoryDownload'
import JSZip from 'jszip'
import { toast } from '@/components/ui/use-toast'

export default function StoryInteraction() {
  const router = useRouter()
  const {
    storySettings,
    characters,
    storyChapters: storedChapters,
    generatedContent: storedContent,
    currentChapter: storedCurrentChapter,
    setImportedState,
  } = useStoryStore()

  const selectedCharacters = characters.filter(
    (char) => char.selected
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [generatedContent, setGeneratedContent] = useState(
    storedContent || null
  )
  const [error, setError] = useState(null)
  const [selectedAction, setSelectedAction] = useState(null)
  const [storyChapters, setStoryChapters] = useState(
    storedChapters || []
  )
  const [currentChapter, setCurrentChapter] = useState(
    storedCurrentChapter || 1
  )
  const [imageGenerator] = useState(
    () => new ImageGenerator()
  )
  const [generatingImages, setGeneratingImages] = useState(
    {}
  )

  // Redirect to initialization if no characters selected and no story
  useEffect(() => {
    if (
      selectedCharacters.length === 0 &&
      storyChapters.length === 0
    ) {
      router.push('/story-initialization')
    }
  }, [
    selectedCharacters.length,
    storyChapters.length,
    router,
  ])

  // Image generation progress indicator
  const totalGeneratingImages = Object.keys(
    generatingImages
  ).length
  const hasGeneratingImages = totalGeneratingImages > 0

  // Add file import handling
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.zip')) {
      toast({
        title: 'Invalid file format',
        description:
          'Please select a valid story backup ZIP file',
        variant: 'destructive',
      })
      return
    }

    setIsImporting(true)

    try {
      toast({
        title: 'Importing story...',
        description: 'Reading backup file',
      })

      // Read the zip file
      const zip = await JSZip.loadAsync(file)

      // Extract the story state
      const stateFile = zip.file('story-state.json')
      if (!stateFile) {
        throw new Error(
          'Invalid backup file: missing story state data'
        )
      }

      const stateJson = await stateFile.async('string')
      const storyState = JSON.parse(stateJson)

      // Process images
      toast({
        title: 'Processing images...',
        description: 'Preparing story content',
      })

      const chapters = storyState.storyChapters || []

      // Assets folder where images are stored
      const assetsFolder = zip.folder('assets')
      if (assetsFolder) {
        // Process each chapter's image
        for (let i = 0; i < chapters.length; i++) {
          const imageFile = assetsFolder.file(
            `${i + 1}.png`
          )
          if (imageFile) {
            // Get image as base64
            const imageBlob = await imageFile.async('blob')
            const base64Image = await blobToBase64(
              imageBlob
            )

            // Update chapter with actual image data
            if (chapters[i]) {
              chapters[i].image = base64Image
              chapters[i].imagePending = false
            }
          }
        }
      }

      // Import the story state
      storyState.storyChapters = chapters
      setImportedState(storyState)

      // Update local state to reflect imported data
      setStoryChapters(chapters)
      setGeneratedContent(storyState.generatedContent)
      setCurrentChapter(
        storyState.currentChapter || chapters.length
      )

      // Log the import
      await logImport({
        filename: file.name,
        chaptersCount: chapters.length,
        timestamp: new Date().toISOString(),
      })

      // Success toast
      toast({
        title: 'Story imported successfully!',
        description: `Loaded story with ${chapters.length} chapters`,
      })
    } catch (error) {
      console.error('Error importing story:', error)
      toast({
        title: 'Import failed',
        description:
          error.message || 'Failed to import story backup',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const logImport = async (metadata) => {
    try {
      await fetch('/api/log-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          metadata,
        }),
      })
    } catch (error) {
      console.error('Failed to log import:', error)
      // Non-blocking - continue even if logging fails
    }
  }

  const generateImageForStory = async (
    storyContent,
    characterNames,
    chapterNumber
  ) => {
    try {
      // Mark this chapter as having image generation in progress
      setGeneratingImages((prev) => ({
        ...prev,
        [chapterNumber]: true,
      }))

      // Generate the image in the background
      const result =
        await imageGenerator.generateStoryImage(
          storyContent,
          characterNames.map((char) => char.name)
        )

      // Update the story chapter with the real image
      setStoryChapters((prevChapters) =>
        prevChapters.map((chapter) =>
          chapter.chapterNumber === chapterNumber
            ? {
                ...chapter,
                image: result.image,
                imagePending: false,
              }
            : chapter
        )
      )

      return result.image
    } catch (error) {
      console.error('Error generating image:', error)
      return null
    } finally {
      // Mark image generation as complete for this chapter
      setGeneratingImages((prev) => {
        const updated = { ...prev }
        delete updated[chapterNumber]
        return updated
      })
    }
  }

  const handleGenerateStory = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    setError(null)
    setSelectedAction(null)
    setStoryChapters([])
    setCurrentChapter(1)

    try {
      const readabilityLabel =
        READABILITY_LEVELS.find(
          (r) => r.level === storySettings.readability
        )?.label || 'Moderate'

      const result = await generateStory({
        setting: storySettings.setting,
        tone: storySettings.tone,
        readabilityLevel: readabilityLabel,
        characters: selectedCharacters,
      })

      // First create and display the chapter with a placeholder image
      const firstChapter = {
        chapterNumber: 1,
        title: 'The Beginning',
        selectedAction: null,
        content: result.story,
        personas: result.personas,
        actionChoices: result.actionChoices,
        imagePending: true, // Indicate that the image is still being generated
        image: null, // No image yet
      }

      setStoryChapters([firstChapter])
      setGeneratedContent(result)

      // Start generating the image in the background
      generateImageForStory(
        result.story,
        selectedCharacters,
        1
      )
    } catch (error) {
      console.error('Error generating story:', error)
      setError(
        'Failed to generate story. Please try again.'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectAction = (action) => {
    if (isGenerating) return
    setSelectedAction(action)
  }

  const handleContinueStory = async () => {
    if (isGenerating || !selectedAction) return

    setIsGenerating(true)
    setError(null)

    try {
      // Get latest chapter to continue from
      const latestChapter =
        storyChapters[storyChapters.length - 1]

      const result = await continueStory({
        previousStory: latestChapter.content,
        personas:
          latestChapter.personas ||
          generatedContent.personas,
        selectedAction: selectedAction,
      })

      // Increment chapter number
      const nextChapter = currentChapter + 1
      setCurrentChapter(nextChapter)

      // Create new chapter with placeholder image first
      const newChapter = {
        chapterNumber: nextChapter,
        title: selectedAction.title,
        selectedAction: selectedAction,
        content: result.story,
        actionChoices: result.actionChoices,
        imagePending: true, // Indicate that the image is still being generated
        image: null, // No image yet
      }

      // Add new chapter to the list
      setStoryChapters((prev) => [...prev, newChapter])

      // Update current active choices
      setGeneratedContent({
        ...generatedContent,
        actionChoices: result.actionChoices,
      })

      // Clear selected action
      setSelectedAction(null)

      // Scroll to the new chapter
      setTimeout(() => {
        const newChapterElement = document.getElementById(
          `chapter-${nextChapter}`
        )
        if (newChapterElement) {
          newChapterElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
      }, 100)

      // Start generating the image in the background
      generateImageForStory(
        result.story,
        selectedCharacters,
        nextChapter
      )
    } catch (error) {
      console.error('Error continuing story:', error)
      setError(
        'Failed to continue the story. Please try again.'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className='flex min-h-screen flex-col p-4 relative'>
      {/* Floating image generation status indicator */}
      {hasGeneratingImages && (
        <div className='fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg z-10 shadow-lg flex items-center'>
          <div className='h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
          <span>
            Generating {totalGeneratingImages}{' '}
            {totalGeneratingImages === 1
              ? 'image'
              : 'images'}
            ...
          </span>
        </div>
      )}

      {/* Import Story button */}
      <div className='mb-4 w-full max-w-4xl mx-auto flex justify-end'>
        <input
          id='import-file'
          type='file'
          accept='.zip'
          className='hidden'
          onChange={handleFileSelect}
          disabled={isImporting}
        />
        <Button
          variant='ghost'
          size='sm'
          onClick={() =>
            document.getElementById('import-file').click()
          }
          disabled={isImporting}
          className='text-muted-foreground hover:text-foreground flex items-center gap-2'>
          {isImporting ? (
            <>
              <div className='h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
              <span>Importing...</span>
            </>
          ) : (
            <>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='mr-2'>
                <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
                <polyline points='17 8 12 3 7 8'></polyline>
                <line x1='12' y1='3' x2='12' y2='15'></line>
              </svg>
              Import Story
            </>
          )}
        </Button>
      </div>

      <Card className='w-full max-w-4xl mx-auto mb-8'>
        <CardHeader>
          <CardTitle>Story Interaction</CardTitle>
          <CardDescription>
            Let&apos;s create a story with your selected
            settings and characters
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-8'>
          <div className='space-y-6'>
            <div className='space-y-2'>
              <h3 className='text-lg font-medium'>
                Story Settings
              </h3>
              <div className='space-y-4'>
                <div>
                  <p className='text-sm font-medium'>
                    Setting
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {storySettings.setting}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium'>
                    Tone
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {storySettings.tone}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium'>
                    Readability Level
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {READABILITY_LEVELS.find(
                      (r) =>
                        r.level ===
                        storySettings.readability
                    )?.label || 'Moderate'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='space-y-2'>
              <h3 className='text-lg font-medium'>
                Selected Characters
              </h3>
              <p className='text-sm text-muted-foreground'>
                {selectedCharacters.length} character
                {selectedCharacters.length !== 1
                  ? 's'
                  : ''}{' '}
                selected
              </p>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
              {selectedCharacters.map((character) => (
                <div
                  key={character.id}
                  className='space-y-2'>
                  <div className='relative aspect-[3/4] rounded-lg overflow-hidden'>
                    <Image
                      src={character.image}
                      alt={character.name}
                      fill
                      className='object-cover'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/80 to-transparent' />
                    <div className='absolute bottom-0 left-0 right-0 p-2 text-white'>
                      <p className='text-sm font-medium truncate'>
                        {character.name}
                      </p>
                    </div>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {character.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className='flex justify-between'>
          <Button
            onClick={handleGenerateStory}
            disabled={isGenerating}
            className='w-full'>
            {isGenerating
              ? 'Generating Story...'
              : Object.keys(generatingImages).length > 0
              ? `Generate Story (${
                  Object.keys(generatingImages).length
                } images pending)`
              : 'Generate Story'}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Card className='w-full max-w-4xl mx-auto bg-red-50'>
          <CardContent className='pt-6'>
            <p className='text-red-600'>{error}</p>
          </CardContent>
        </Card>
      )}

      {storyChapters.length > 0 && (
        <div className='space-y-8 w-full max-w-4xl mx-auto'>
          {/* Display all chapters */}
          {storyChapters.map((chapter, index) => (
            <Card
              key={chapter.chapterNumber}
              id={`chapter-${chapter.chapterNumber}`}
              className='w-full mb-8'>
              <CardHeader>
                <CardTitle>
                  Chapter {chapter.chapterNumber}:{' '}
                  {chapter.title}
                </CardTitle>
                {chapter.selectedAction && (
                  <CardDescription>
                    Previous choice:{' '}
                    {chapter.selectedAction.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className='space-y-8'>
                {/* Image section with placeholder support */}
                <div className='w-full'>
                  <div className='relative w-full aspect-square rounded-lg overflow-hidden bg-gray-200'>
                    {chapter.imagePending ? (
                      // Placeholder with loading animation
                      <div className='absolute inset-0 flex flex-col items-center justify-center bg-gray-100 animate-pulse'>
                        <div className='h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin'></div>
                        <p className='mt-4 text-sm text-gray-500'>
                          Generating image...
                        </p>
                      </div>
                    ) : chapter.image ? (
                      // Real image when available
                      <Image
                        src={chapter.image}
                        alt={`Chapter ${chapter.chapterNumber} illustration`}
                        fill
                        className='object-cover'
                      />
                    ) : (
                      // Fallback if no image and not pending
                      <div className='absolute inset-0 flex items-center justify-center bg-gray-100'>
                        <p className='text-gray-500'>
                          No image available
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Image generation status indicator */}
                  {generatingImages[
                    chapter.chapterNumber
                  ] && (
                    <div className='mt-2 text-xs text-primary animate-pulse'>
                      Generating image...
                    </div>
                  )}
                </div>

                <div className='space-y-4'>
                  <h3 className='text-lg font-medium'>
                    Story
                  </h3>
                  <div className='whitespace-pre-wrap'>
                    {chapter.content}
                  </div>
                </div>

                {chapter.chapterNumber === 1 &&
                  chapter.personas && (
                    <div className='space-y-4'>
                      <h3 className='text-lg font-medium'>
                        Character Personas
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {chapter.personas.map(
                          (persona, personaIndex) => (
                            <Card
                              key={personaIndex}
                              className='bg-muted/50'>
                              <CardHeader className='py-3'>
                                <CardTitle className='text-md'>
                                  {persona.name}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className='text-sm'>
                                  {persona.description}
                                </p>
                              </CardContent>
                            </Card>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action choices card section */}
      {generatedContent?.actionChoices &&
        storyChapters.length > 0 && (
          <Card className='w-full max-w-4xl mx-auto mb-8'>
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
              <CardDescription>
                Choose one of these actions to continue the
                story
                {Object.keys(generatingImages).length >
                  0 && (
                  <span className='ml-2 text-xs text-primary'>
                    ({Object.keys(generatingImages).length}{' '}
                    {Object.keys(generatingImages)
                      .length === 1
                      ? 'image'
                      : 'images'}{' '}
                    still generating)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {generatedContent.actionChoices.map(
                  (action, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all ${
                        selectedAction === action
                          ? 'ring-2 ring-primary'
                          : 'hover:bg-muted/50'
                      } ${
                        isGenerating
                          ? 'opacity-70 pointer-events-none'
                          : ''
                      }`}
                      onClick={() =>
                        handleSelectAction(action)
                      }>
                      <CardHeader className='py-3'>
                        <CardTitle className='text-md'>
                          {action.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-2'>
                        <p className='text-sm'>
                          {action.description}
                        </p>
                        <p className='text-sm text-muted-foreground italic'>
                          {action.consequence}
                        </p>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className='w-full'
                disabled={!selectedAction || isGenerating}
                variant={
                  selectedAction ? 'default' : 'outline'
                }
                onClick={handleContinueStory}>
                {isGenerating
                  ? 'Continuing Story...'
                  : 'Continue Story'}
              </Button>
            </CardFooter>
          </Card>
        )}

      {/* Download story card - only shown when we have story content */}
      {storyChapters.length > 0 && (
        <Card className='w-full max-w-4xl mx-auto mb-8'>
          <CardHeader>
            <CardTitle>Save Your Story</CardTitle>
            <CardDescription>
              Download your complete story as a zip file
              containing all story text, generated images,
              and configuration settings. You can upload
              this file later to continue where you left
              off.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex justify-center'>
            <div className='w-full max-w-md'>
              <StoryDownload
                storyChapters={storyChapters}
                storySettings={storySettings}
                characters={selectedCharacters}
                generatedContent={generatedContent}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
