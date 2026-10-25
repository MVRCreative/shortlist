import { openai } from '@ai-sdk/openai'

const DEFAULT_MODEL = 'gpt-6-luna'

/** Direct OpenAI model. Reads OPENAI_API_KEY. Optional OPENAI_MODEL overrides the id. */
export function profileModel() {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  const modelId = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL
  return openai(modelId)
}

export function aiErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('OPENAI_API_KEY')) {
    return 'Add OPENAI_API_KEY to the server environment, then try again.'
  }
  console.warn('[shortlist]', message || error)
  return fallback
}
