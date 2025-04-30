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
import {
  generateStory,
  continueStory,
} from '@/lib/storyGenerator'
import { READABILITY_LEVELS } from '@/lib/constants'
import { ImageGenerator } from '@/lib/imageGeneration/imageGenerator'

export default function StoryInteraction() {
  const { storySettings, characters } = useStoryStore()
  const selectedCharacters = characters.filter(
    (char) => char.selected
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] =
    useState(null)
  const [error, setError] = useState(null)
  const [selectedAction, setSelectedAction] = useState(null)
  const [storyChapters, setStoryChapters] = useState([])
  const [currentChapter, setCurrentChapter] = useState(1)
  const [imageGenerator] = useState(
    () => new ImageGenerator()
  )
  const [isGeneratingImage, setIsGeneratingImage] =
    useState(false)

  const generateImageForStory = async (
    storyContent,
    characterNames
  ) => {
    try {
      setIsGeneratingImage(true)
      const result =
        await imageGenerator.generateStoryImage(
          storyContent,
          characterNames.map((char) => char.name)
        )
      return {
        image: result.image,
      }
    } catch (error) {
      console.error('Error generating image:', error)
      return {
        image: null,
      }
    } finally {
      setIsGeneratingImage(false)
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

      // Generate image for the story content
      const storyImage = await generateImageForStory(
        result.story,
        selectedCharacters
      )

      // Save first chapter with number, title, selected action, and image
      const firstChapter = {
        chapterNumber: 1,
        title: 'The Beginning',
        selectedAction: null,
        content: result.story,
        personas: result.personas,
        actionChoices: result.actionChoices,
        image: storyImage.image,
      }

      setStoryChapters([firstChapter])
      setGeneratedContent(result)
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

      // Generate image for the continuation
      const storyImage = await generateImageForStory(
        result.story,
        selectedCharacters
      )

      // Increment chapter number
      const nextChapter = currentChapter + 1
      setCurrentChapter(nextChapter)

      // Create new chapter object with image
      const newChapter = {
        chapterNumber: nextChapter,
        title: selectedAction.title,
        selectedAction: selectedAction,
        content: result.story,
        actionChoices: result.actionChoices,
        image: storyImage.image,
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
    <div className='flex min-h-screen flex-col p-4'>
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

        <CardFooter>
          <Button
            onClick={handleGenerateStory}
            disabled={isGenerating || isGeneratingImage}
            className='w-full'>
            {isGenerating
              ? 'Generating Story...'
              : isGeneratingImage
              ? 'Generating Image...'
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
                {chapter.image && (
                  <div className='w-full'>
                    <div className='relative w-full aspect-square rounded-lg overflow-hidden'>
                      <Image
                        src={chapter.image}
                        alt={`Chapter ${chapter.chapterNumber} illustration`}
                        fill
                        className='object-cover'
                      />
                    </div>
                  </div>
                )}

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

      {generatedContent?.actionChoices &&
        storyChapters.length > 0 && (
          <Card className='w-full max-w-4xl mx-auto mb-8'>
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
              <CardDescription>
                Choose one of these actions to continue the
                story
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
                        isGenerating || isGeneratingImage
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
                disabled={
                  !selectedAction ||
                  isGenerating ||
                  isGeneratingImage
                }
                variant={
                  selectedAction ? 'default' : 'outline'
                }
                onClick={handleContinueStory}>
                {isGenerating
                  ? 'Continuing Story...'
                  : isGeneratingImage
                  ? 'Generating Image...'
                  : 'Continue Story'}
              </Button>
            </CardFooter>
          </Card>
        )}
    </div>
  )
}
