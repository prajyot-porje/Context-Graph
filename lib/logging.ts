interface LogParams {
  context: string
  model: string
  messages?: Array<{ role: string; content: string }>
  temperature?: number
  maxTokens?: number
  status: 'SUCCESS' | 'FAILED'
  modelUsed?: string
  content?: string | null
  reasoning?: string | null
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    cost?: number
  }
  error?: string
}

export function logOpenRouterCall({
  context,
  model,
  status,
  modelUsed,
  usage,
  error,
}: LogParams) {
  try {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${context.toUpperCase()}]`

    if (status === 'SUCCESS') {
      const tokensStr = usage ? ` | Tokens: ${usage.total_tokens ?? 'unknown'} (P:${usage.prompt_tokens ?? '?'}/C:${usage.completion_tokens ?? '?'})` : ''
      const costStr = usage && usage.cost !== undefined ? ` | Cost: $${usage.cost.toFixed(6)}` : ''
      const modelUsedStr = modelUsed && modelUsed !== model ? ` | Used Fallback: ${modelUsed}` : ` | Model: ${model}`
      console.log(`${prefix} SUCCESS | ${modelUsedStr}${tokensStr}${costStr}`)
    } else {
      console.error(`${prefix} FAILED | Model: ${model} | Error: ${error || 'Unknown Error'}`)
    }
  } catch (err) {
    console.error('Failed to log OpenRouter call:', err)
  }
}
