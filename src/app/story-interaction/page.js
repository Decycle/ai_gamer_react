'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useStoryStore } from '@/store/useStoryStore'
import Image from 'next/image'

export default function StoryInteraction() {
  const { storySettings, characters } = useStoryStore()
  const selectedCharacters = characters.filter(
    (char) => char.selected
  )

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-4xl'>
        <CardHeader>
          <CardTitle>Story Interaction</CardTitle>
          <CardDescription>
            Here&apos;s all the data that was transferred
            from the initialization page
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
                    {storySettings.readability}
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
      </Card>
    </div>
  )
}
