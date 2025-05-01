'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import JSZip from 'jszip'

export function StoryImport({ onImport }) {
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsImporting(true)
    setError(null)

    try {
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

      // Extract images and convert them back to base64
      // This is a placeholder for future implementation
      // When this component is fully implemented, it would:
      // 1. Extract all images from assets/
      // 2. Convert them to base64
      // 3. Update the storyState with the correct image references
      // 4. Call onImport with the complete restored state

      if (onImport) {
        onImport(storyState)
      } else {
        console.log(
          'Story state restored but no import handler provided:',
          storyState
        )
      }
    } catch (error) {
      console.error('Error importing story backup:', error)
      setError(
        error.message || 'Failed to import story backup'
      )
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className='space-y-4'>
      <label className='block'>
        <span className='sr-only'>Choose backup file</span>
        <input
          type='file'
          accept='.zip'
          onChange={handleFileSelect}
          disabled={isImporting}
          className='block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-primary-foreground
            hover:file:bg-primary/90'
        />
      </label>

      {isImporting && (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <div className='h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
          <span>Importing story backup...</span>
        </div>
      )}

      {error && (
        <div className='text-sm text-red-500'>{error}</div>
      )}
    </div>
  )
}
