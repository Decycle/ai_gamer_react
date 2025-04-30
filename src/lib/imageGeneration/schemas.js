import { z } from 'zod'

// Equivalent to ChatGPTRegionPrompt in Python
export const RegionPromptSchema = z
  .object({
    character: z
      .string()
      .nullable()
      .optional()
      .describe(
        'The name of the character, if any, for this region of the image'
      ),
    prompt: z
      .string()
      .describe(
        'The drawing prompt for this region of the image'
      ),
    mask: z
      .array(z.number())
      .length(4)
      .describe('The mask of the region, [x1, y1, x2, y2]'),
  })
  .refine(
    (data) => {
      return !(
        data.mask[0] >= data.mask[2] ||
        data.mask[1] >= data.mask[3]
      )
    },
    {
      message:
        'Invalid mask, coordinates must satisfy x1 < x2 and y1 < y2',
    }
  )

// Equivalent to ChatGPTInputSchema in Python
export const ChatGPTInputSchema = z.object({
  base_prompt: z
    .string()
    .describe('Base prompt for the entire scene'),
  background_prompt: z
    .string()
    .describe(
      'Background prompt for parts not covered by regional prompts'
    ),
  regional_prompts: z
    .array(RegionPromptSchema)
    .describe(
      'Regional prompts for specific areas of the image'
    ),
})

// Equivalent to RegionPrompt in Python
export const RunpodRegionPromptSchema = z
  .object({
    prompt: z.string().describe('Prompt'),
    mask: z.array(z.number()).length(4).describe('Mask'),
    id_hash: z
      .string()
      .nullable()
      .optional()
      .describe('Image hash'),
    id_weight: z
      .number()
      .default(0.8)
      .describe('Weight for the ID image'),
  })
  .refine(
    (data) => {
      return !(
        data.mask[0] >= data.mask[2] ||
        data.mask[1] >= data.mask[3]
      )
    },
    {
      message:
        'Invalid mask, coordinates must satisfy x1 < x2 and y1 < y2',
    }
  )

// Equivalent to InputSchema in Python
export const RunpodInputSchema = z.object({
  width: z
    .number()
    .default(1024)
    .describe('Width of the output image'),
  height: z
    .number()
    .default(1024)
    .describe('Height of the output image'),
  num_samples: z
    .number()
    .default(1)
    .describe('Number of images to generate'),
  num_inference_steps: z
    .number()
    .default(24)
    .describe('Number of inference steps'),
  guidance_scale: z
    .number()
    .default(3.5)
    .describe('Guidance scale'),
  seed: z.number().default(-1).describe('Seed'),

  mask_inject_steps: z
    .number()
    .default(8)
    .describe('Mask inject steps'),
  double_inject_blocks_interval: z
    .number()
    .default(1)
    .describe('Double inject blocks interval'),
  single_inject_blocks_interval: z
    .number()
    .default(2)
    .describe('Single inject blocks interval'),
  base_ratio: z
    .number()
    .default(0.1)
    .describe('Base ratio'),

  base_prompt: z.string().describe('Base prompt'),
  background_prompt: z
    .string()
    .describe('Background prompt'),

  regional_prompts: z
    .array(RunpodRegionPromptSchema)
    .describe('Regional prompts'),
  username: z.string().describe('Username'),
})
