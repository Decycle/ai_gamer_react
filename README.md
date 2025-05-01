This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, clone the repository:

```bash
git clone https://github.com/Decycle/ai_gamer_react.git
cd ai_gamer_react
```

Then, install the dependencies:

```bash
pnpm install
```
### Note: If you don't have pnpm installed, you can install it globally using npm:

```bash
npm install -g pnpm
```

Then, set up your environment variables by creating a `.env` file in the root directory with the following variables:

```bash

OPENAI_API_KEY=your_openai_api_key_here
USER_UPLOAD_IMG_SECRET=your_digital_ocean_space_secret_key_here
USER_UPLOAD_IMG_ACCESS=your_digital_ocean_space_access_key_here
SPACE_URL=your_space_url_here
SPACE_REGION=your_space_region_here
RUNPOD_URL=your_runpod_url_here
RUNPOD_API_KEY=your_runpod_api_key_here
```

Finally, run the development server:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.