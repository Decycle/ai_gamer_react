'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { CharacterCard } from '@/components/CharacterCard'
import { useStoryStore } from '@/store/useStoryStore'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import { toast } from '@/components/ui/use-toast'

const STORY_TONES = [
  'Lighthearted and humorous',
  'Dark and mysterious',
  'Epic and grand',
  'Intimate and personal',
  'Suspenseful and thrilling',
  'Philosophical and thought-provoking',
  'Romantic and emotional',
  'Action-packed and fast-paced',
  'Whimsical and magical',
  'Realistic and grounded',
]

const READABILITY_LEVELS = [
  {
    level: 1,
    label: 'Very Easy',
    description: 'Simple language, short sentences',
  },
  {
    level: 2,
    label: 'Easy',
    description:
      'Basic vocabulary, straightforward narrative',
  },
  {
    level: 3,
    label: 'Moderate',
    description: 'Standard language, some complex ideas',
  },
  {
    level: 4,
    label: 'Advanced',
    description: 'Rich vocabulary, complex themes',
  },
  {
    level: 5,
    label: 'Expert',
    description: 'Sophisticated language, deep themes',
  },
]

export default function StoryInitialization() {
  const router = useRouter()
  const {
    currentPage,
    totalPages,
    storySettings,
    characters,
    setStorySetting,
    setRandomSetting,
    setStoryTone,
    setReadability,
    toggleCharacter,
    nextPage,
    prevPage,
    canProceed,
    setImportedState,
  } = useStoryStore()

  const progress = ((currentPage + 1) / totalPages) * 100
  const selectedCharacters = characters.filter(
    (char) => char.selected
  )

  // Add file input reference and import handling
  const [isImporting, setIsImporting] = useState(false)

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

      // Navigate to story interaction page
      router.push('/story-interaction')
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

  const renderPage = () => {
    switch (currentPage) {
      case 0:
        return (
          <div className='space-y-8'>
            <div className='space-y-6'>
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>
                  What kind of story would you like to
                  create?
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Describe your story&apos;s setting or
                  choose a random one to get started.
                </p>
              </div>

              <div className='space-y-4'>
                <Textarea
                  placeholder="Describe your story's setting..."
                  value={storySettings.setting}
                  onChange={(e) =>
                    setStorySetting(e.target.value)
                  }
                  className='min-h-[100px]'
                />

                <Button
                  variant='outline'
                  onClick={setRandomSetting}
                  className='w-full'>
                  Generate Random Setting
                </Button>
              </div>
            </div>

            <div className='space-y-6'>
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>
                  Story Tone
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Choose the overall tone and mood of your
                  story.
                </p>
              </div>

              <RadioGroup
                value={storySettings.tone}
                onValueChange={setStoryTone}
                className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {STORY_TONES.map((tone) => (
                  <div
                    key={tone}
                    className='flex items-center space-x-2'>
                    <RadioGroupItem
                      value={tone}
                      id={tone}
                    />
                    <Label
                      htmlFor={tone}
                      className='text-sm'>
                      {tone}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className='space-y-6'>
              <div className='space-y-2'>
                <h3 className='text-lg font-medium'>
                  Readability Level
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Choose how complex you want the language
                  and themes to be.
                </p>
              </div>

              <RadioGroup
                value={storySettings.readability.toString()}
                onValueChange={(value) =>
                  setReadability(parseInt(value))
                }
                className='space-y-4'>
                {READABILITY_LEVELS.map((level) => (
                  <div
                    key={level.level}
                    className='flex items-start space-x-2'>
                    <RadioGroupItem
                      value={level.level.toString()}
                      id={`level-${level.level}`}
                    />
                    <div className='grid gap-1.5 leading-none'>
                      <Label
                        htmlFor={`level-${level.level}`}
                        className='text-sm font-medium'>
                        {level.label}
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        {level.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )
      case 1:
        return (
          <div className='space-y-6'>
            <div className='space-y-2'>
              <h3 className='text-lg font-medium'>
                Select Your Characters
              </h3>
              <p className='text-sm text-muted-foreground'>
                Choose the characters that will be part of
                your story. You can select multiple
                characters.
              </p>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onToggle={toggleCharacter}
                />
              ))}
            </div>
          </div>
        )
      case 2:
        return (
          <div className='space-y-8'>
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
                      {
                        READABILITY_LEVELS.find(
                          (l) =>
                            l.level ===
                            storySettings.readability
                        )?.label
                      }
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
                    className='relative aspect-[3/4] rounded-lg overflow-hidden'>
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
                ))}
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className='flex min-h-screen flex-col p-4'>
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
          variant='outline'
          size='sm'
          onClick={() =>
            document.getElementById('import-file').click()
          }
          disabled={isImporting}
          className='flex items-center gap-2'>
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
                strokeLinejoin='round'>
                <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
                <polyline points='17 8 12 3 7 8'></polyline>
                <line x1='12' y1='3' x2='12' y2='15'></line>
              </svg>
              <span>Import Existing Story</span>
            </>
          )}
        </Button>
      </div>

      <div className='flex flex-col gap-8 w-full max-w-4xl mx-auto'>
        <Card>
          <CardHeader>
            <CardTitle>Create Your Story</CardTitle>
            <CardDescription>
              Follow the steps to create an interactive
              story
            </CardDescription>
          </CardHeader>
          <CardContent>{renderPage()}</CardContent>
          <CardFooter className='flex justify-between border-t p-6 bg-muted/20'>
            <Button
              variant='outline'
              onClick={prevPage}
              disabled={currentPage === 0}>
              Back
            </Button>
            <div className='flex-1 mx-8'>
              <Progress value={progress} max={100} />
            </div>
            {currentPage === totalPages - 1 ? (
              <Button
                onClick={() =>
                  router.push('/story-interaction')
                }
                disabled={!canProceed()}>
                Start Story
              </Button>
            ) : (
              <Button
                onClick={nextPage}
                disabled={!canProceed()}>
                Next
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
