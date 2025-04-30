'use client'

import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'

export default function Home() {
  const { count, increment, decrement, reset } = useStore()

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='flex flex-col gap-4 items-center'>
        <h1 className='text-4xl font-bold'>
          Button Test Page
        </h1>
        <div className='flex gap-4'>
          <Button>Default Button</Button>
          <Button variant='destructive'>Destructive</Button>
          <Button variant='outline'>Outline</Button>
          <Button variant='secondary'>Secondary</Button>
        </div>

        <div className='mt-8 flex flex-col items-center gap-4'>
          <h2 className='text-2xl font-semibold'>
            Counter: {count}
          </h2>
          <div className='flex gap-4'>
            <Button onClick={decrement}>-</Button>
            <Button onClick={reset}>Reset</Button>
            <Button onClick={increment}>+</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
