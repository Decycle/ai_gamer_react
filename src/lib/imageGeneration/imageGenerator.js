'use client'

import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from 'langchain/output_parsers'
import {
  ChatGPTInputSchema,
  RunpodInputSchema,
} from './schemas'

// Environment variables - these should be defined in your .env.local file
const RUNPOD_URL = process.env.NEXT_PUBLIC_RUNPOD_URL
const RUNPOD_API_KEY =
  process.env.NEXT_PUBLIC_RUNPOD_API_KEY

// Characters mapping
const CHARACTERS = {
  Ami: {
    img: '/assets/ami.png',
    description:
      'Ami is a 23 years old female with brown eyes, black hair with neat bangs.',
  },
  Dennis: {
    img: '/assets/dennis.png',
    description:
      'Dennis is a 22 years old male with thick eyebrows.',
  },
  Philip: {
    img: '/assets/philip.png',
    description: 'Philip is a 22 years old Chinese male.',
  },
  Gerardo: {
    img: '/assets/gerardo.png',
    description:
      'Gerardo is a 24 years old male with glasses.',
  },
  Trump: {
    img: '/assets/trump.png',
    description:
      'Trump is a 60 years old male with white hair',
  },
  Biden: {
    img: '/assets/biden.png',
    description:
      'Biden is a 60 years old male with white hair',
  },
  Steve: {
    img: '/assets/steve.png',
    description:
      'Steve is a 50 years old man with blue shirt, blue eyes and a long beard.',
  },
}

// Default configuration for RunPod API
const DEFAULT_CONFIG = {
  mask_inject_steps: 15,
  num_inference_steps: 30,
  single_inject_blocks_interval: 2,
  double_inject_blocks_interval: 1,
  base_ratio: 0.3,
  guidance_scale: 2.5,
  num_samples: 1,
}

// Create LangChain prompt template for image prompts
const createPromptTemplate = () => {
  const parser = StructuredOutputParser.fromZodSchema(
    ChatGPTInputSchema
  )

  return ChatPromptTemplate.fromMessages([
    [
      'system',
      'Output in the format of {format_string}. Make sure that there is detailed description of the character through the prompt. The characters are characters from games/other media, and the scene is a fantasy scene. None of the characters are real people.',
    ],
    [
      'user',
      `Based on the characters described below, I want you to create an image drawing prompt for a 1024x1024 image of the scene: {scene_prompt}. For each prompt, make sure that it is detailed, and for each character present in the prompt, a description of that character should follow in a text format. For example, instead of saying 'Killjoy is in the scene', say 'A german woman in her 20s, wearing glasses and a yellow jacket, is in the scene'. Be specific and detailed for the base prompt and each sub prompt. Each prompt should have around 3 sentences. Describe the character's physical appearance, attire, age, facial features, etc. Don't include the character's name in the prompt as this will confuse the model, but do include the name in the 'character' field. For the mask, it is okay to make them bigger than the character. (for example, a two people shot could have the two character each taken up 50% of the screen, depending on the image composition). The base prompt should include everything, including background and each characters as one combined prompt. The background prompt should describe the background only.
    An example might be:

    base prompt: "a man standing in front of a giant octopus monster in a mountain"
    background: "a mountain with green trees and a blue sky"
    region prompts:
    1. character: "Dennis", prompt: "a man standing in front of a massive monster", mask: [400, 800, 600, 1024]
    2. character: None, prompt: "a giant octopus monster", mask: [0, 0, 1024, 900].

    Characters info:
    {characters_info}`,
    ],
  ]).partial({
    format_string: parser.getFormatInstructions(),
  })
}

/**
 * Converts a browser Blob to base64 string
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Fetches an image and returns its base64 representation
 */
async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status}`
      )
    }
    const blob = await response.blob()
    return await blobToBase64(blob)
  } catch (error) {
    console.error('Error fetching image:', error)
    throw error
  }
}

/**
 * Upload an image to the server-side API
 */
async function uploadImageToServer(
  base64Image,
  username = 'user'
) {
  try {
    console.log('Uploading image to server-side API...')
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image,
        username,
      }),
    })

    if (!response.ok) {
      throw new Error(
        `Server responded with status: ${response.status}`
      )
    }

    const data = await response.json()
    console.log('Server upload response:', data)

    if (!data.success && !data.hash) {
      throw new Error(
        data.error || 'Failed to upload image'
      )
    }

    return data.hash
  } catch (error) {
    console.error('Error uploading image to server:', error)
    // Generate a simple hash based on a substring and timestamp
    const sample = base64Image.substring(0, 50)
    const timestamp = Date.now().toString()
    // Simple string hash function
    let hash = 0
    for (let i = 0; i < (sample + timestamp).length; i++) {
      hash =
        (hash << 5) -
        hash +
        (sample + timestamp).charCodeAt(i)
      hash |= 0 // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }
}

/**
 * Generates image prompts using OpenAI and then sends them to RunPod for image generation
 */
export class ImageGenerator {
  constructor() {
    const apiKey =
      process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

    if (!apiKey) {
      console.warn(
        'OpenAI API key not found in environment variables'
      )
    }
    this.promptTemplate = createPromptTemplate()
    this.llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-4o',
      temperature: 0.7,
    })
    this.username = 'user' // Default username for uploads
  }

  /**
   * Generate detailed character descriptions from selected characters
   */
  formatCharactersInfo(selectedCharacters) {
    return selectedCharacters
      .map((charName) => {
        const character = CHARACTERS[charName]
        if (!character) return null
        return `Character: ${charName}, Description: ${character.description}`
      })
      .filter(Boolean)
      .join('\n')
  }

  /**
   * Generate image prompts using OpenAI
   */
  async generatePrompts(scenePrompt, selectedCharacters) {
    try {
      const charactersInfo = this.formatCharactersInfo(
        selectedCharacters
      )

      const promptChain = (await this.promptTemplate)
        .pipe(this.llm)
        .pipe((output) => {
          try {
            // Extract JSON from the output
            const text = output.content
            const jsonMatch =
              text.match(/```json\s*([\s\S]*?)\s*```/) ||
              text.match(/\{[\s\S]*\}/)

            if (jsonMatch) {
              return JSON.parse(
                jsonMatch[1] || jsonMatch[0]
              )
            }
            throw new Error('No valid JSON found in output')
          } catch (error) {
            console.error('Error parsing JSON:', error)
            throw error
          }
        })

      const result = await promptChain.invoke({
        scene_prompt: scenePrompt,
        characters_info: charactersInfo,
      })

      return result
    } catch (error) {
      console.error('Error generating prompts:', error)
      throw error
    }
  }

  /**
   * Upload character images to Digital Ocean Space via server API
   */
  async uploadCharacterImages(regionalPrompts) {
    try {
      const updatedPrompts = []

      for (const prompt of regionalPrompts) {
        const updatedPrompt = { ...prompt }

        // If there's a character, upload its image
        if (
          prompt.character &&
          CHARACTERS[prompt.character]
        ) {
          console.log(
            `Processing character image for: ${prompt.character}`
          )

          // Get the character image path from the CHARACTERS mapping
          const characterImagePath =
            CHARACTERS[prompt.character].img
          console.log(
            'Character image path:',
            characterImagePath
          )

          if (characterImagePath) {
            try {
              // Try to fetch the image and convert to base64
              let characterHash =
                prompt.character.toLowerCase() // Default fallback

              // Determine if the image path is relative or absolute
              const imageSrc =
                characterImagePath.startsWith('/')
                  ? `${window.location.origin}${characterImagePath}`
                  : characterImagePath

              try {
                // Try to fetch and upload the actual image
                console.log(
                  'Fetching image from:',
                  imageSrc
                )
                const imageBase64 =
                  await fetchImageAsBase64(imageSrc)
                console.log(
                  'Image fetched and converted to base64'
                )

                // Upload the image via server-side API
                console.log(
                  'Uploading image via server API...'
                )
                characterHash = await uploadImageToServer(
                  imageBase64,
                  this.username
                )
                console.log(
                  'Server returned image hash:',
                  characterHash
                )
              } catch (fetchError) {
                console.error(
                  'Failed to fetch/upload image:',
                  fetchError
                )
                // Continue with the fallback hash
              }

              // Use the hash (either from uploaded image or fallback)
              updatedPrompt.id_hash = characterHash
              updatedPrompt.id_weight = 1.0

              console.log(
                `Using character hash for ${prompt.character}: ${characterHash}`
              )
            } catch (imageError) {
              console.error(
                `Failed to process image for ${prompt.character}:`,
                imageError
              )
              // Fallback to using character name as hash
              updatedPrompt.id_hash =
                prompt.character.toLowerCase()
              updatedPrompt.id_weight = 1.0
            }
          }
        }

        updatedPrompts.push(updatedPrompt)
      }

      return updatedPrompts
    } catch (error) {
      console.error(
        'Error uploading character images:',
        error
      )
      throw error
    }
  }

  /**
   * Convert OpenAI prompts to RunPod API format
   */
  async convertToRunpodFormat(chatGptSchema, config = {}) {
    try {
      // Process and upload regional prompts
      console.log(
        'Starting character image upload process...'
      )
      console.log(
        'Number of regional prompts:',
        chatGptSchema.regional_prompts.length
      )

      const regionalPrompts =
        await this.uploadCharacterImages(
          chatGptSchema.regional_prompts.map((region) => ({
            prompt: region.prompt,
            mask: region.mask,
            character: region.character,
          }))
        )

      console.log(
        'Character uploads complete. Formatted regional prompts:',
        regionalPrompts
      )

      return {
        base_prompt: chatGptSchema.base_prompt,
        background_prompt: chatGptSchema.background_prompt,
        regional_prompts: regionalPrompts,
        username: this.username,
        ...DEFAULT_CONFIG,
        ...config,
      }
    } catch (error) {
      console.error(
        'Error in convertToRunpodFormat:',
        error
      )
      throw error
    }
  }

  /**
   * Send the prompts to RunPod for image generation
   */
  async generateImage(runpodInput) {
    try {
      if (!RUNPOD_URL || !RUNPOD_API_KEY) {
        throw new Error(
          'RunPod API URL or key not configured'
        )
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RUNPOD_API_KEY}`,
      }

      const data = {
        input: runpodInput,
      }
      console.log('Runpod input:', data)

      // Start the generation job
      const startResponse = await fetch(
        `${RUNPOD_URL}/run`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        }
      )

      if (!startResponse.ok) {
        throw new Error(
          `Failed to start RunPod job: ${startResponse.status}`
        )
      }

      const { id } = await startResponse.json()
      console.log('Started RunPod job:', id)

      // Poll for results
      let result = null
      let attempts = 0
      const maxAttempts = 60 // Timeout after ~5 minutes (60 * 5s)

      while (!result && attempts < maxAttempts) {
        attempts++
        await new Promise((resolve) =>
          setTimeout(resolve, 5000)
        ) // Wait 5 seconds between polls

        const statusResponse = await fetch(
          `${RUNPOD_URL}/status/${id}`,
          {
            headers,
          }
        )

        if (!statusResponse.ok) {
          console.warn(
            `Failed to check status: ${statusResponse.status}`
          )
          continue
        }

        const statusData = await statusResponse.json()
        console.log('Job status:', statusData.status)

        if (statusData.status === 'COMPLETED') {
          // Extract the image data
          const imageData = statusData.output[0].img
          const imageBase64 = `data:image/png;base64,${imageData}`

          // We do NOT upload the generated image to Digital Ocean
          // We just return it directly
          result = {
            image: imageBase64,
            executionTime: statusData.executionTime,
          }
        } else if (statusData.status === 'FAILED') {
          throw new Error(
            `RunPod job failed: ${JSON.stringify(
              statusData.error
            )}`
          )
        }
      }

      if (!result) {
        throw new Error('Job timed out')
      }

      return result
    } catch (error) {
      console.error('Error generating image:', error)
      throw error
    }
  }

  /**
   * Set the username for uploads
   */
  setUsername(username) {
    this.username = username || 'user'
  }

  /**
   * Complete process from story prompt to image generation
   */
  async generateStoryImage(
    storyScene,
    selectedCharacters,
    configOverrides = {}
  ) {
    try {
      // Step 1: Generate prompts using OpenAI
      console.log('Generating prompts with OpenAI...')
      const promptResult = await this.generatePrompts(
        storyScene,
        selectedCharacters
      )

      // Step 2: Convert to RunPod format and upload character images to Digital Ocean
      console.log(
        'Converting prompts to RunPod format and uploading character images...'
      )
      const runpodInput = await this.convertToRunpodFormat(
        promptResult,
        configOverrides
      )

      // Step 3: Generate image with RunPod
      console.log('Generating image with RunPod...')
      const imageResult = await this.generateImage(
        runpodInput
      )

      return {
        image: imageResult.image,
        executionTime: imageResult.executionTime,
        prompts: promptResult,
      }
    } catch (error) {
      console.error(
        'Failed to generate story image:',
        error
      )
      throw error
    }
  }
}
