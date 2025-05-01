import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

// Ensure logs directory exists
const logsDir = path.resolve(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true })
    console.log('Created logs directory:', logsDir)
  } catch (err) {
    console.error('Failed to create logs directory:', err)
  }
}

/**
 * Save RunPod input request to a log file
 */
export async function POST(request) {
  try {
    // Get the request data
    const data = await request.json()
    const { runpodInput, metadata = {} } = data

    // Create a timestamp for the log file name
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
    const logFileName = `runpod-request-${timestamp}.json`
    const logFilePath = path.join(logsDir, logFileName)

    // Add timestamp to the log data
    const logData = {
      timestamp: new Date().toISOString(),
      runpodInput,
      metadata,
    }

    // Write the log file
    fs.writeFileSync(
      logFilePath,
      JSON.stringify(logData, null, 2),
      'utf8'
    )

    console.log(`RunPod request logged to: ${logFilePath}`)

    return NextResponse.json({
      success: true,
      logFile: logFileName,
    })
  } catch (error) {
    console.error('Error logging RunPod request:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
