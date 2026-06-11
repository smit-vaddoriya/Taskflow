import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { prisma } from '../config/prisma'
import { validate } from '../middleware/validate'
import { requireOrgAccess } from '../middleware/auth'
import { AppError } from '../utils/AppError'
import { generateSprintSummary } from '../services/ai/ai.service'

const router = Router()

router.use(requireOrgAccess())

// GET /api/sprints?projectId=xxx
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.query
    if (!projectId) throw new AppError('projectId required', 400)

    const sprints = await prisma.sprint.findMany({
      where: { projectId: projectId as string },
      orderBy: { startDate: 'desc' },
    })
    res.json({ success: true, data: sprints })
  } catch (err) { next(err) }
})

// POST /api/sprints
router.post(
  '/',
  requireOrgAccess(['OWNER', 'ADMIN', 'MANAGER']),
  [
    body('projectId').isUUID(),
    body('name').trim().isLength({ min: 1 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId, name, goal, startDate, endDate } = req.body
      const sprint = await prisma.sprint.create({
        data: { projectId, name, goal, startDate: new Date(startDate), endDate: new Date(endDate) },
      })
      res.status(201).json({ success: true, data: sprint })
    } catch (err) { next(err) }
  }
)

// PATCH /api/sprints/:id/start
router.patch('/:id/start', requireOrgAccess(['OWNER', 'ADMIN', 'MANAGER']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sprint = await prisma.sprint.update({
      where: { id: req.params.id },
      data: { isActive: true },
    })
    res.json({ success: true, data: sprint })
  } catch (err) { next(err) }
})

// PATCH /api/sprints/:id/complete
router.patch('/:id/complete', requireOrgAccess(['OWNER', 'ADMIN', 'MANAGER']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { tasks: true } } },
    })
    if (!sprint) throw new AppError('Sprint not found', 404)

    const tasks = await prisma.task.findMany({ where: { sprintId: sprint.id } })
    const completedTasks = tasks.filter(t => t.status === 'DONE').length
    const totalTasks = tasks.length

    // Generate AI sprint summary
    let aiSummary: string | undefined
    try {
      aiSummary = await generateSprintSummary({
        sprintName: sprint.name,
        startDate: sprint.startDate.toISOString(),
        endDate: sprint.endDate.toISOString(),
        totalTasks,
        completedTasks,
        cancelledTasks: tasks.filter(t => t.status === 'CANCELLED').length,
        carryoverTasks: tasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED').length,
        averageTaskAge: 0,
        blockedTaskCount: 0,
        teamSize: 1,
      })
    } catch { /* AI is optional */ }

    const updated = await prisma.sprint.update({
      where: { id: req.params.id },
      data: { isCompleted: true, isActive: false, aiSummary },
    })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// DELETE /api/sprints/:id
router.delete('/:id', requireOrgAccess(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.sprint.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Sprint deleted' })
  } catch (err) { next(err) }
})

export default router