'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to story initialization page
    router.push('/story-initialization')
  }, [router])

  // Return a loading state while redirecting
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='flex flex-col gap-4 items-center'>
        <div className='h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin'></div>
        <p className='text-xl font-medium'>
          Redirecting to story creator...
        </p>
      </div>
    </div>
  )
}
