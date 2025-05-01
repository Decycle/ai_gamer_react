'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export function StoryDownload({
  storyChapters,
  storySettings,
  characters,
  generatedContent,
}) {
  const [isDownloading, setIsDownloading] = useState(false)

  // Log the download activity
  const logDownload = async (metadata) => {
    try {
      await fetch('/api/log-download', {
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
      console.error('Failed to log download:', error)
      // Non-blocking - continue with download even if logging fails
    }
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Create a new ZIP file
      const zip = new JSZip()

      // Create assets folder
      const assetsFolder = zip.folder('assets')

      // Track download metadata
      const downloadMetadata = {
        chapterCount: storyChapters.length,
        hasImages: storyChapters.some((c) => !!c.image),
        setting: storySettings.setting,
        characters: characters.map((c) => c.name),
        timestamp: new Date().toISOString(),
      }

      // Add images to the assets folder
      for (let i = 0; i < storyChapters.length; i++) {
        const chapter = storyChapters[i]
        if (chapter.image) {
          try {
            // Handle different formats of base64 data
            let imageData
            if (chapter.image.startsWith('data:image')) {
              imageData = chapter.image.split(',')[1]
            } else {
              imageData = chapter.image
            }

            const imageBlob = await fetch(
              `data:image/png;base64,${imageData}`
            ).then((res) => res.blob())

            // Add to zip file
            assetsFolder.file(`${i + 1}.png`, imageBlob)
          } catch (error) {
            console.error(
              `Error adding image for chapter ${i + 1}:`,
              error
            )
          }
        }
      }

      // Create story.txt with all chapters
      let storyText = ''
      storyChapters.forEach((chapter, index) => {
        storyText += `##### Chapter ${index + 1} #####\n\n`
        if (chapter.title) {
          storyText += `${chapter.title}\n\n`
        }
        storyText += `${chapter.content}\n\n`
      })
      zip.file('story.txt', storyText)

      // Create config.txt with story settings and characters
      const configData = {
        storySettings,
        characters: characters,
      }
      zip.file(
        'config.txt',
        JSON.stringify(configData, null, 2)
      )

      // Store complete story state for possible restoration
      const storyStateData = {
        storyChapters,
        generatedContent,
        storySettings,
        characters,
        currentChapter: storyChapters.length,
        lastUpdated: new Date().toISOString(),
      }

      zip.file(
        'story-state.json',
        JSON.stringify(storyStateData, null, 2)
      )

      // Create a README.md with instructions
      const readmeContent = `# Interactive Story Backup

This backup contains a complete snapshot of your interactive story. It includes:

- **assets/**: Folder containing all generated images
- **story.txt**: The complete story text with chapter separations
- **config.txt**: Story settings and character information
- **story-state.json**: Complete story state for restoration

To restore this story, use the "Import Story" feature in the application.
`
      zip.file('README.md', readmeContent)

      // Generate the zip file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
      })

      // Save the zip file with a descriptive name
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
      const safeTitle =
        storyChapters[0]?.title?.replace(
          /[^a-z0-9]/gi,
          '_'
        ) || 'story'
      const filename = `${safeTitle}_${timestamp}.zip`
      saveAs(zipBlob, filename)

      // Log the download (non-blocking)
      logDownload({
        ...downloadMetadata,
        filename,
      })
    } catch (error) {
      console.error('Error creating zip file:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading || storyChapters.length === 0}
      variant='outline'
      className='flex items-center gap-2 w-full'>
      {isDownloading ? (
        <>
          <div className='h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
          <span>Creating backup...</span>
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
            <polyline points='7 10 12 15 17 10'></polyline>
            <line x1='12' y1='15' x2='12' y2='3'></line>
          </svg>
          <span>Download Story Backup</span>
        </>
      )}
    </Button>
  )
}
