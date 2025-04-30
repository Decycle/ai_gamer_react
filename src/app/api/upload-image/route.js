import AWS from 'aws-sdk'
import crypto from 'crypto'
import { NextResponse } from 'next/server'

// Environment variables for Digital Ocean Spaces
const SPACE_URL = process.env.SPACE_URL
const SPACE_REGION = process.env.SPACE_REGION || 'nyc3'
const ACCESS_KEY = process.env.USER_UPLOAD_IMG_ACCESS
const SECRET_KEY = process.env.USER_UPLOAD_IMG_SECRET
const BUCKET_NAME = process.env.BUCKET_NAME || 'images'

console.log('API Environment:', {
  SPACE_URL: SPACE_URL || '(not set)',
  SPACE_REGION,
  BUCKET_NAME,
  ACCESS_KEY: ACCESS_KEY ? '(set)' : '(not set)',
  SECRET_KEY: SECRET_KEY ? '(set)' : '(not set)',
})

/**
 * Create a connection to Digital Ocean Space
 */
function connectToSpace() {
  try {
    console.log(
      'Initializing S3 client for Digital Ocean Space'
    )

    // For Digital Ocean Spaces, we need to construct the endpoint URL properly
    let endpoint = SPACE_URL

    // Ensure the endpoint is properly formatted
    if (endpoint && !endpoint.startsWith('http')) {
      endpoint = `https://${endpoint}`
    }

    // If no endpoint is provided, construct from region
    if (!endpoint) {
      endpoint = `https://${SPACE_REGION}.digitaloceanspaces.com`
    }

    console.log('S3 endpoint:', endpoint)

    // Create S3 client configuration
    const s3Config = {
      endpoint,
      region: SPACE_REGION,
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
      },
      // Use path-style for compatibility (recommended for DO Spaces)
      s3ForcePathStyle: true,
    }

    console.log('S3 config created')
    const s3 = new AWS.S3(s3Config)
    console.log('S3 client initialized')

    return s3
  } catch (error) {
    console.error('Failed to initialize S3 client:', error)
    throw error
  }
}

/**
 * Check if an object with the given key exists in the bucket
 */
async function keyExists(client, bucket, key) {
  try {
    console.log(`Checking if key exists: ${bucket}/${key}`)

    // Create the headObject params
    const params = {
      Bucket: bucket,
      Key: key,
    }

    console.log(
      'headObject params:',
      JSON.stringify(params)
    )

    // Use promises for better error handling
    await client.headObject(params).promise()
    console.log(`Key exists: ${bucket}/${key}`)
    return true
  } catch (error) {
    if (error.code === 'NotFound') {
      console.log(`Key does not exist: ${bucket}/${key}`)
      return false
    }
    console.error(
      `Error checking if key exists: ${bucket}/${key}`,
      error
    )
    throw error
  }
}

/**
 * Convert a base64 image to a buffer
 */
function base64ToBuffer(base64Image) {
  // Remove the data:image/png;base64, prefix if present
  const base64Data = base64Image.replace(
    /^data:image\/\w+;base64,/,
    ''
  )
  return Buffer.from(base64Data, 'base64')
}

/**
 * API route handler for POST requests
 */
export async function POST(request) {
  try {
    // Check if Space credentials are configured
    console.log('DO Credentials:', {
      url: SPACE_URL ? '✓' : '✗',
      region: SPACE_REGION,
      access: ACCESS_KEY ? '✓' : '✗',
      secret: SECRET_KEY ? '✓' : '✗',
    })

    if (!SPACE_URL || !ACCESS_KEY || !SECRET_KEY) {
      console.warn(
        'Digital Ocean Space credentials not configured. Using fallback method.'
      )

      // Parse request body
      const body = await request.json()
      const { base64Image, username = 'user' } = body

      // Generate fallback hash
      const imageDataSample = base64Image.substring(0, 100)
      const hasher = crypto.createHash('sha256')
      hasher.update(imageDataSample)
      const hash = hasher.digest('hex')

      return NextResponse.json({
        success: true,
        hash,
        note: 'Using fallback hash (DO Space not configured)',
      })
    }

    // Parse request body
    const body = await request.json()
    const { base64Image, username = 'user' } = body

    // Create a hash of the image data
    const imageBuffer = base64ToBuffer(base64Image)
    const hasher = crypto.createHash('sha256')
    hasher.update(imageBuffer)
    const hash = hasher.digest('hex')

    // Create the file name with the hash
    // Using a consistent format for object keys
    const sanitizedUsername = username
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
    const fileName = `${sanitizedUsername}/${hash}`

    console.log(
      `Preparing to upload: ${fileName} to bucket: ${BUCKET_NAME}`
    )

    // Connect to Digital Ocean Space
    const client = connectToSpace()

    try {
      // Check if the image already exists
      const exists = await keyExists(
        client,
        BUCKET_NAME,
        fileName
      )

      if (!exists) {
        // Upload the image if it doesn't exist
        console.log(
          `Uploading new image to ${BUCKET_NAME}/${fileName}`
        )
        const uploadResult = await client
          .putObject({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: imageBuffer,
            ContentType: 'image/png',
            ACL: 'public-read',
          })
          .promise()

        console.log(`Upload successful:`, uploadResult)
        console.log(`Uploaded new image: ${fileName}`)
      } else {
        console.log(`Image already exists: ${fileName}`)
      }
    } catch (uploadError) {
      console.error('S3 operation failed:', uploadError)
      // Continue with the hash even if the upload fails
      console.log(
        'Continuing with hash despite upload failure'
      )
    }

    // Return the hash of the image
    return NextResponse.json({ success: true, hash })
  } catch (error) {
    console.error('Failed to upload image:', error)

    // Generate fallback hash in case of error
    try {
      const body = await request.json()
      const { base64Image } = body

      return NextResponse.json({
        success: false,
        error: error.message,
        note: 'Error',
      })
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process request',
          details: error.message,
        },
        { status: 500 }
      )
    }
  }
}
