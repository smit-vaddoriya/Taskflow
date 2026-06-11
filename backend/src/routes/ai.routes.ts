import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { validate } from '../middleware/validate'
import { aiRateLimiter } from '../middleware/rateLimiter'
import {
  generateTaskBreakdown,
  suggestTaskPriority,
  parseNaturalLanguageTask,
  generateStandupReport,
  generateSprintSummary,
  analyzeCommentThread,
  generateAnalyticsInsight,
} from '../services/ai/ai.service'

const router = Router()

router.post('/breakdown', aiRateLimiter, [body('title').notEmpty(), body('description').notEmpty()], validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await generateTaskBreakdown(req.body.title, req.body.description)
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  }
)

router.post('/priority', aiRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await suggestTaskPriority(req.body)
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  }
)

router.post('/parse-task', aiRateLimiter, [body('input').notEmpty()], validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await parseNaturalLanguageTask(req.body.input)
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  }
)

router.post('/standup', aiRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await generateStandupReport(req.body.entries)
      res.json({ success: true, data: { report } })
    } catch (err) { next(err) }
  }
)

router.post('/sprint-summary', aiRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await generateSprintSummary(req.body)
      res.json({ success: true, data: { summary } })
    } catch (err) { next(err) }
  }
)

router.post('/analyze-comments', aiRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await analyzeCommentThread(req.body.comments)
      res.json({ success: true, data: result })
    } catch (err) { next(err) }
  }
)

router.post('/analytics-insight', aiRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const insight = await generateAnalyticsInsight(req.body)
      res.json({ success: true, data: { insight } })
    } catch (err) { next(err) }
  }
)

router.post('/chat', aiRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { systemPrompt, message } = req.body
      if (!message) throw new AppError('Message required', 400)

      const Groq = (await import('groq-sdk')).default
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

      const response = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt ?? 'You are a helpful project management assistant.' },
          { role: 'user', content: message },
        ],
        temperature: 0.5,
        max_tokens: 500,
      })

      const reply = response.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.'
      res.json({ success: true, data: { reply } })
    } catch (err) {
      next(err)
    }
  }
)

export default router