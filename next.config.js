/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_RUNPOD_URL: process.env.RUNPOD_URL,
    NEXT_PUBLIC_RUNPOD_API_KEY: process.env.RUNPOD_API_KEY,
    NEXT_PUBLIC_SPACE_URL: process.env.SPACE_URL,
    NEXT_PUBLIC_SPACE_REGION: process.env.SPACE_REGION,
    NEXT_PUBLIC_USER_UPLOAD_IMG_ACCESS:
      process.env.USER_UPLOAD_IMG_ACCESS,
    NEXT_PUBLIC_USER_UPLOAD_IMG_SECRET:
      process.env.USER_UPLOAD_IMG_SECRET,
  },
  // Use server actions for API routes
  // serverActions: {
  //   bodySizeLimit: '10mb', // Allow larger payloads for image uploads
  // },
  // Make environment variables available to server-side code
  serverRuntimeConfig: {
    SPACE_URL: process.env.SPACE_URL,
    SPACE_REGION: process.env.SPACE_REGION,
    USER_UPLOAD_IMG_ACCESS:
      process.env.USER_UPLOAD_IMG_ACCESS,
    USER_UPLOAD_IMG_SECRET:
      process.env.USER_UPLOAD_IMG_SECRET,
    BUCKET_NAME: process.env.BUCKET_NAME || 'images',
  },
}

module.exports = nextConfig
