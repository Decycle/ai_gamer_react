This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, set up your environment variables by creating a `.env.local` file in the root directory with the following variables:

```bash
# OpenAI API key for story generation
OPENAI_API_KEY=your_openai_api_key_here

# RunPod API configuration for image generation
RUNPOD_URL=your_runpod_endpoint_url_here
RUNPOD_API_KEY=your_runpod_api_key_here

# Digital Ocean Space configuration for image storage
DO_SPACE_URL=your_space_endpoint_url_here
DO_SPACE_REGION=your_space_region_here
DO_ACCESS_KEY=your_space_access_key_here
DO_SECRET_KEY=your_space_secret_key_here
DO_BUCKET_NAME=your_bucket_name_here
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

This interactive storytelling application includes:

- Story generation with OpenAI GPT-4o
- Character selection and persona creation
- Multi-step story progression with user choices
- Image generation workflow:
  - Character avatar uploads to Digital Ocean Spaces
  - Character hashes sent to RunPod for region-aware image generation
  - Final images displayed directly from RunPod output
- Responsive and modern UI with Tailwind CSS and Shadcn UI

## API Requirements

### OpenAI API

You need an OpenAI API key to use the story generation features. Get one at [OpenAI Platform](https://platform.openai.com/).

### RunPod API

For image generation, you need a RunPod account and API key. Set up a RunPod endpoint for image generation at [RunPod](https://www.runpod.io/).

### Digital Ocean Spaces

For character image storage, you need a Digital Ocean account with Spaces enabled. Digital Ocean Spaces are used to host character avatar images that are referenced by RunPod during image generation via their hashes.

Configure a Space with the following steps:

1. Create a [Digital Ocean](https://www.digitalocean.com/) account
2. Create a new Space in your preferred region
3. Create API access keys with read/write permissions
4. Configure your `.env.local` file with the Space credentials

The application includes a fallback mechanism for when Digital Ocean credentials are not available, which will use character name hashes instead of actual image uploads for development purposes.

## Image Generation Workflow

The application uses a two-step process for image generation:

1. **Character Image Handling**:
   - Character avatar images are uploaded to Digital Ocean Space via a server-side API
   - The server handles authentication and storage to avoid CORS and security issues
   - Each image receives a unique hash identifier returned to the client
   - These hashes are sent to RunPod to identify the character regions

2. **Story Image Generation**:
   - Character hashes and prompts are sent to RunPod
   - RunPod generates a composite image incorporating the characters
   - The generated image is displayed directly in the UI

This server-side approach is more secure and reliable than client-side uploads, especially when dealing with cross-origin requests and authentication.

### Running Without Digital Ocean

The application includes fallback mechanisms for development environments:
- If Digital Ocean credentials are not available, the server will generate character name hashes
- This allows for development without a Digital Ocean account, but character consistency in images will be reduced

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
