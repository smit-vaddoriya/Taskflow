import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' })
const MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

async function callGroq(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  })
  return response.choices[0]?.message?.content ?? ''
}

export async function generateTaskBreakdown(title: string, description: string) {
  const system = `You are a senior software engineer. Break the task into subtasks.
Respond ONLY with valid JSON:
{"subTasks":[{"title":"string","description":"string","estimatedHours":number,"priority":"LOW"|"MEDIUM"|"HIGH"|"URGENT"}],"totalEstimatedHours":number,"summary":"string"}`
  try {
    const raw = await callGroq(system, `Task: ${title}\nDescription: ${description}`)
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch { throw new Error('Failed to generate task breakdown') }
}

export async function suggestTaskPriority(context: {
  taskTitle: string; dueDate?: string; assigneeWorkload: number
  dependencyCount: number; projectDeadline?: string
}) {
  const system = `You are a project management AI. Suggest priority.
Respond ONLY with valid JSON:
{"suggestedPriority":"LOW"|"MEDIUM"|"HIGH"|"URGENT","reasoning":"string","confidence":number}`
  try {
    const raw = await callGroq(system, JSON.stringify(context))
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch { throw new Error('Failed to suggest priority') }
}

export async function parseNaturalLanguageTask(input: string) {
  const today = new Date().toISOString().split('T')[0]
  const system = `You are a task parsing AI. Today is ${today}.
Respond ONLY with valid JSON:
{"title":"string","description":"string|null","priority":"NONE"|"LOW"|"MEDIUM"|"HIGH"|"URGENT","dueDate":"ISO date|null","assigneeName":"string|null","labels":[]}`
  try {
    const raw = await callGroq(system, input)
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch { throw new Error('Failed to parse task') }
}

export async function generateStandupReport(entries: object[]) {
  const system = `You are an engineering team assistant. Generate a concise daily standup report with bullet points per person.`
  try {
    return await callGroq(system, `Team standup data:\n${JSON.stringify(entries, null, 2)}`)
  } catch { throw new Error('Failed to generate standup') }
}

export async function generateSprintSummary(sprintData: object) {
  const system = `You are an agile coach AI. Analyze sprint metrics and generate a concise retrospective under 300 words. Include velocity analysis, what went well, concerns, and 2-3 recommendations.`
  try {
    return await callGroq(system, JSON.stringify(sprintData, null, 2))
  } catch { throw new Error('Failed to generate sprint summary') }
}

export async function analyzeCommentThread(comments: { author: string; content: string; createdAt: string }[]) {
  const system = `You are a project management assistant. Extract action items and summarize the thread.
Respond ONLY with valid JSON:
{"actionItems":["string"],"summary":"string"}`
  try {
    const user = comments.map(c => `[${c.author} at ${c.createdAt}]: ${c.content}`).join('\n')
    const raw = await callGroq(system, user)
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch { throw new Error('Failed to analyze comments') }
}

export async function generateAnalyticsInsight(metrics: {
  completionRate: number; velocityChange: number
  overdueCount: number; avgBlockedDays: number; topContributors: string[]
}) {
  const system = `You are a data analyst AI for a project management tool. Write a 2-3 sentence plain-English insight. Be direct and actionable.`
  try {
    return await callGroq(system, JSON.stringify(metrics))
  } catch { throw new Error('Failed to generate insight') }
}