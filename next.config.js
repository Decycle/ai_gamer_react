/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
}

module.exports = nextConfig
