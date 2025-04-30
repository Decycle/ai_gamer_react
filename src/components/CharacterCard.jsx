'use client'

import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

export function CharacterCard({ character, onToggle }) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 cursor-pointer border-0
        ${
          character.selected
            ? 'ring-4 ring-blue-500'
            : 'ring-2 ring-transparent'
        }
        rounded-lg`}
      onClick={() => onToggle(character.id)}>
      <div
        className=''
        style={{ paddingBottom: '133.33%' }}>
        <Image
          src={character.image}
          alt={character.name}
          fill
          className='object-cover'
          style={{}}
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/80 to-transparent' />
      </div>

      <CardContent className='absolute bottom-0 left-0 right-0 p-4 text-white'>
        <div>
          <h3 className='font-semibold'>
            {character.name}
          </h3>
          <p className='text-sm text-white/80 line-clamp-2'>
            {character.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
