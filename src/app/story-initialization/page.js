'use client'

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
  } = useStoryStore()

  const progress = ((currentPage + 1) / totalPages) * 100
  const selectedCharacters = characters.filter(
    (char) => char.selected
  )

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
    <div className='flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-4xl'>
        <CardHeader>
          <CardTitle>Story Initialization</CardTitle>
          <CardDescription>
            Step {Math.min(currentPage, 2)} of 2:{' '}
            {currentPage === 0
              ? 'Story Settings'
              : currentPage === 1
              ? 'Character Selection'
              : 'Review'}
          </CardDescription>
          <Progress
            value={(Math.min(currentPage, 2) / 2) * 100}
            className='mt-4'
          />
        </CardHeader>

        <CardContent>{renderPage()}</CardContent>

        <CardFooter className='flex justify-between'>
          <Button
            variant='outline'
            onClick={prevPage}
            disabled={currentPage === 0}>
            Previous
          </Button>
          {currentPage === 2 ? (
            <Button
              size='lg'
              className='bg-primary hover:bg-primary/90'
              onClick={() =>
                router.push('/story-interaction')
              }>
              Let&apos;s Go!
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
  )
}
