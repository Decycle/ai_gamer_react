'use client'

import AWS from 'aws-sdk'
import crypto from 'crypto'

// Environment variables for Digital Ocean Spaces
const SPACE_URL = process.env.NEXT_PUBLIC_SPACE_URL
const SPACE_REGION =
  process.env.NEXT_PUBLIC_SPACE_REGION || 'nyc3'
const ACCESS_KEY =
  process.env.NEXT_PUBLIC_USER_UPLOAD_IMG_ACCESS
const SECRET_KEY =
  process.env.NEXT_PUBLIC_USER_UPLOAD_IMG_SECRET
const BUCKET_NAME = 'images'

/**
 * Create a connection to Digital Ocean Space
 */
export function connectToSpace() {
  try {
    const s3 = new AWS.S3({
      endpoint: SPACE_URL,
      region: SPACE_REGION,
      credentials: new AWS.Credentials({
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
      }),
    })
    return s3
  } catch (error) {
    console.error(
      'Failed to connect to Digital Ocean Space:',
      error
    )
    throw error
  }
}

/**
 * Check if an object with the given key exists in the bucket
 */
export async function keyExists(client, bucket, key) {
  try {
    await client
      .headObject({ Bucket: bucket, Key: key })
      .promise()
    return true
  } catch (error) {
    if (error.code === 'NotFound') {
      return false
    }
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
 * Upload an image to Digital Ocean Space
 */
export async function uploadImage(
  base64Image,
  username = 'user'
) {
  try {
    // Check if Digital Ocean Space credentials are configured
    console.log('SPACE_URL', SPACE_URL)
    console.log('ACCESS_KEY', ACCESS_KEY)
    console.log('SECRET_KEY', SECRET_KEY)
    if (!SPACE_URL || !ACCESS_KEY || !SECRET_KEY) {
      console.warn(
        'Digital Ocean Space credentials not configured. Using fallback method.'
      )
      // Return a fallback hash based on a portion of the image data
      // This is just for demonstration - in production, always use proper storage
      return null
    }

    // Create a hash of the image data
    const imageBuffer = base64ToBuffer(base64Image)
    const hasher = crypto.createHash('sha256')
    hasher.update(imageBuffer)
    const hash = hasher.digest('hex')

    // Create the file name with the hash
    const fileName = `${username}/${hash}`

    // Connect to Digital Ocean Space
    const client = connectToSpace()

    // Check if the image already exists
    const exists = await keyExists(
      client,
      BUCKET_NAME,
      fileName
    )

    console.log('exists', exists)
    console.log('fileName', fileName)
    console.log('imageBuffer', imageBuffer)

    if (!exists) {
      // Upload the image if it doesn't exist
      await client
        .putObject({
          Bucket: BUCKET_NAME,
          Key: fileName,
          Body: imageBuffer,
          ContentType: 'image/png',
          ACL: 'public-read',
        })
        .promise()

      console.log(`Uploaded new image: ${fileName}`)
    } else {
      console.log(`Image already exists: ${fileName}`)
    }

    // Return the hash of the image
    return hash
  } catch (error) {
    console.error('Failed to upload image:', error)
    // Return a fallback hash in case of error
    const fallbackHasher = crypto.createHash('sha256')
    fallbackHasher.update(base64Image.substring(0, 100))
    return fallbackHasher.digest('hex')
  }
}
