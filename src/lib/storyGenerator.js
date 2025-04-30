'use client'

import { z } from 'zod'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'

// Define schemas for our structured output
const PersonaSchema = z
  .object({
    name: z.string().describe('The name of the character'),
    description: z
      .string()
      .describe(
        "A detailed description of the character's persona in the story"
      ),
  })
  .describe(
    "Information about a character's persona in the story"
  )

const ActionChoiceSchema = z
  .object({
    title: z
      .string()
      .describe(
        'A short, compelling title for this action choice'
      ),
    description: z
      .string()
      .describe(
        'A brief description of what this action choice entails'
      ),
    consequence: z
      .string()
      .describe(
        'A hint about the potential outcome of this choice (without revealing too much)'
      ),
  })
  .describe(
    'An action choice that will progress the story to the next chapter'
  )

const StoryOutputSchema = z
  .object({
    story: z
      .string()
      .describe(
        'The generated story based on the provided settings and characters'
      ),
    personas: z
      .array(PersonaSchema)
      .describe(
        'List of personas for each character in the story'
      ),
    actionChoices: z
      .array(ActionChoiceSchema)
      .min(3)
      .max(3)
      .describe(
        'Three possible action choices that would progress the story to the next chapter'
      ),
  })
  .describe(
    'Output containing the generated story, character personas, and action choices'
  )

// Define schema for continuing the story
const StoryProgressionSchema = z
  .object({
    story: z
      .string()
      .describe(
        'The next chapter of the story based on the chosen action'
      ),
    actionChoices: z
      .array(ActionChoiceSchema)
      .min(3)
      .max(3)
      .describe(
        'Three new possible action choices for the next story progression'
      ),
  })
  .describe(
    'Output containing the next chapter of the story and new action choices'
  )

// Create parsers from our schemas
const parser = StructuredOutputParser.fromZodSchema(
  StoryOutputSchema
)

const progressionParser =
  StructuredOutputParser.fromZodSchema(
    StoryProgressionSchema
  )

// Create the prompt templates
const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a creative story generator that creates engaging stories based on user inputs.
     The story should match the specified setting, tone, and readability level.
     Each character should have a unique persona that fits within the story.
     At the end of each story chapter, provide exactly three distinct action choices that would lead to different story developments.
     Wrap the output in \`json\` tags.

     {format_instructions}`,
  ],
  [
    'human',
    `Create a story with the following parameters:

     Setting: {setting}
     Tone: {tone}
     Readability Level: {readabilityLevel}

     Characters in the story:
     {characters}

     Generate a compelling story that incorporates these characters and matches the specified setting and tone.
     For each character, create a unique persona within the story. The persona should include personality traits,
     motivations, and role in the story.

     At the end, provide exactly three possible action choices that would continue the story.
     Each action choice should:
     1. Be distinct and lead to a different direction for the story
     2. Include a brief title
     3. Include a short description of the action
     4. Include a hint about the potential consequences without revealing too much`,
  ],
])

const progressionPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a creative story continuation generator. Based on the previous chapter and the chosen action,
     you generate the next compelling chapter of the story.
     At the end of each story chapter, provide exactly three distinct action choices that would lead to different
     story developments.
     Maintain the same tone, setting, and readability level as the previous chapter.
     Wrap the output in \`json\` tags.

     {format_instructions}`,
  ],
  [
    'human',
    `Previous chapter:
     {previousStory}

     Character personas:
     {personas}

     Chosen action:
     Title: {actionTitle}
     Description: {actionDescription}

     Continue the story based on this chosen action. Make sure the continuation feels like
     a natural progression from the previous chapter and reflects the consequences of the chosen action.

     At the end, provide exactly three new possible action choices that would continue the story further.
     Each action choice should:
     1. Be distinct and lead to a different direction for the story
     2. Include a brief title
     3. Include a short description of the action
     4. Include a hint about the potential consequences without revealing too much`,
  ],
])

const extractJsonFromOutput = (message) => {
  const text = message.content

  // Define the regular expression pattern to match JSON blocks
  const pattern = /```json\s*((.|\n)*?)\s*```/gs

  // Find all non-overlapping matches of the pattern in the string
  const matches = pattern.exec(text)

  if (matches && matches[1]) {
    try {
      return JSON.parse(matches[1].trim())
    } catch (error) {
      throw new Error(`Failed to parse: ${matches[1]}`)
    }
  } else {
    // If we didn't find explicit json code blocks, try to find any JSON object
    const jsonPattern = /\{[\s\S]*\}/g
    const jsonMatches = text.match(jsonPattern)

    if (jsonMatches) {
      try {
        return JSON.parse(jsonMatches[0])
      } catch (error) {
        console.error(
          'Failed to parse JSON alternative format:',
          error
        )
      }
    }

    throw new Error(`No JSON found in: ${text}`)
  }
}

export async function generateStory({
  setting,
  tone,
  readabilityLevel,
  characters,
}) {
  try {
    // Get API key from environment variables
    const apiKey =
      process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

    if (!apiKey) {
      console.warn(
        'OpenAI API key not found in environment variables'
      )
    }

    // Initialize the LLM with the API key
    const model = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-4o', // Use GPT-4o for better creative results
      temperature: 0.7, // Some creativity, but not too wild
    })

    // Format the characters for the prompt
    const formattedCharacters = characters
      .map((char) => `- ${char.name}: ${char.description}`)
      .join('\n')

    // Prepare the prompt with variables
    const partialPrompt = await prompt.partial({
      format_instructions: parser.getFormatInstructions(),
    })

    const storyChain = partialPrompt
      .pipe(model)
      .pipe(extractJsonFromOutput)

    const parsedOutput = await storyChain.invoke({
      setting,
      tone,
      readabilityLevel,
      characters: formattedCharacters,
    })

    return parsedOutput
  } catch (error) {
    console.error('Error generating story:', error)
    throw error
  }
}

export async function continueStory({
  previousStory,
  personas,
  selectedAction,
}) {
  try {
    // Get API key from environment variables
    const apiKey =
      process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

    if (!apiKey) {
      console.warn(
        'OpenAI API key not found in environment variables'
      )
    }

    // Initialize the LLM with the API key
    const model = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-4o', // Use GPT-4o for better creative results
      temperature: 0.7, // Some creativity, but not too wild
    })

    // Format the personas for the prompt
    const formattedPersonas = personas
      .map(
        (persona) =>
          `- ${persona.name}: ${persona.description}`
      )
      .join('\n')

    // Prepare the prompt with variables
    const partialPrompt = await progressionPrompt.partial({
      format_instructions:
        progressionParser.getFormatInstructions(),
    })

    const progressionChain = partialPrompt
      .pipe(model)
      .pipe(extractJsonFromOutput)

    const parsedOutput = await progressionChain.invoke({
      previousStory: previousStory,
      personas: formattedPersonas,
      actionTitle: selectedAction.title,
      actionDescription: selectedAction.description,
    })

    return parsedOutput
  } catch (error) {
    console.error('Error continuing story:', error)
    throw error
  }
}
