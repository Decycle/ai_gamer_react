'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import { useStoryStore } from '@/store/useStoryStore'
import { toast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'

export function GlobalFileDrop({ children }) {
  const router = useRouter()
  const { setImportedState } = useStoryStore()
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    // Define the drag event handlers
    const handleDragEnter = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }

    const handleDragOver = (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
      setIsDragging(true)
    }

    const handleDragLeave = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    }

    const handleDrop = async (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const file = files[0]
      if (!file.name.endsWith('.zip')) {
        toast({
          title: 'Invalid file format',
          description:
            'Please drop a valid story backup ZIP file',
          variant: 'destructive',
        })
        return
      }

      await processFile(file)
    }

    // Add the event listeners to the document
    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)

    // Clean up
    return () => {
      document.removeEventListener(
        'dragenter',
        handleDragEnter
      )
      document.removeEventListener(
        'dragover',
        handleDragOver
      )
      document.removeEventListener(
        'dragleave',
        handleDragLeave
      )
      document.removeEventListener('drop', handleDrop)
    }
  }, [router, setImportedState])

  const processFile = async (file) => {
    try {
      // Show loading toast
      toast({
        title: 'Importing story...',
        description: 'Reading backup file',
      })

      // Read the zip file
      const zip = await JSZip.loadAsync(file)

      // Extract the story state
      const stateFile = zip.file('story-state.json')
      if (!stateFile) {
        toast({
          title: 'Invalid backup file',
          description: 'Missing story state data',
          variant: 'destructive',
        })
        return
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
        action: (
          <ToastAction
            altText='View story'
            onClick={() =>
              router.push('/story-interaction')
            }>
            View now
          </ToastAction>
        ),
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

  return (
    <>
      {children}

      {/* Overlay for drag and drop */}
      {isDragging && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center'>
          <div className='bg-white dark:bg-black p-8 rounded-lg max-w-xl w-full text-center'>
            <div className='flex flex-col items-center space-y-4 p-8'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='64'
                height='64'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
                className='text-primary animate-bounce'>
                <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
                <polyline points='17 8 12 3 7 8'></polyline>
                <line x1='12' y1='3' x2='12' y2='15'></line>
              </svg>

              <h2 className='text-2xl font-bold'>
                Drop Story Backup Here
              </h2>
              <p className='text-muted-foreground'>
                Release to import your story backup file
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
