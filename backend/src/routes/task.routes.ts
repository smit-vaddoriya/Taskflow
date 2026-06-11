import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/prisma'
import { cache, cacheKeys } from '../config/redis'
import { requireOrgAccess } from '../middleware/auth'
import { AppError } from '../utils/AppError'
import { io } from '../index'

const router = Router()

router.use(requireOrgAccess())

// GET /api/tasks
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { boardId, sprintId, assigneeId, status, priority } = req.query
    const orgId = req.organizationId!

    const tasks = await prisma.task.findMany({
      where: {
        organizationId: orgId,
        ...(boardId && { boardId: boardId as string }),
        ...(sprintId && { sprintId: sprintId as string }),
        ...(assigneeId && { assigneeId: assigneeId as string }),
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
        labels: { include: { label: true } },
        subTasks: { select: { id: true, title: true, status: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { position: 'asc' },
    })

    res.json({ success: true, data: tasks })
  } catch (err) {
    next(err)
  }
})

// GET /api/tasks/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId! },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
        labels: { include: { label: true } },
        subTasks: { select: { id: true, title: true, status: true } },
        _count: { select: { comments: true, attachments: true } },
      },
    })
    if (!task) throw new AppError('Task not found', 404)
    res.json({ success: true, data: task })
  } catch (err) {
    next(err)
  }
})

// POST /api/tasks
router.post(
  '/',
  requireOrgAccess(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        boardId, title, description, priority, status,
        dueDate, assigneeId, sprintId, parentTaskId, estimatedHours,
      } = req.body
      const orgId = req.organizationId!
      const userId = req.user!.id

      const lastTask = await prisma.task.findFirst({
        where: { boardId, organizationId: orgId },
        orderBy: { position: 'desc' },
        select: { position: true },
      })

      const task = await prisma.task.create({
        data: {
          organizationId: orgId,
          boardId,
          title,
          description,
          priority: priority ?? 'NONE',
          status: status ?? 'TODO',
          position: (lastTask?.position ?? 0) + 1000,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          assigneeId: assigneeId || undefined,
          sprintId: sprintId || undefined,
          parentTaskId: parentTaskId || undefined,
          estimatedHours: estimatedHours || undefined,
          createdById: userId,
        },
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true } },
        },
      })

      await cache.del(cacheKeys.boardTasks(boardId))
      io.to(`org:${orgId}`).emit('task:created', task)

      res.status(201).json({ success: true, data: task })
    } catch (err) {
      next(err)
    }
  }
)

// PATCH /api/tasks/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const orgId = req.organizationId!
    const userId = req.user!.id

    const existing = await prisma.task.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!existing) throw new AppError('Task not found', 404)

    const {
      title, description, status, priority, dueDate,
      assigneeId, position, sprintId, estimatedHours, actualHours, boardId,
    } = req.body

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(position !== undefined && { position }),
        ...(sprintId !== undefined && { sprintId: sprintId || null }),
        ...(estimatedHours !== undefined && { estimatedHours }),
        ...(actualHours !== undefined && { actualHours }),
        ...(boardId !== undefined && { boardId }),
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    if (status && status !== existing.status) {
      await prisma.activityLog.create({
        data: {
          taskId: id,
          userId,
          action: 'status_changed',
          oldValue: existing.status,
          newValue: status,
        },
      })
    }

    await cache.del(cacheKeys.boardTasks(updated.boardId))
    io.to(`org:${orgId}`).emit('task:updated', updated)

    res.json({ success: true, data: updated })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/tasks/:id
router.delete(
  '/:id',
  requireOrgAccess(['OWNER', 'ADMIN', 'MANAGER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const orgId = req.organizationId!

      const task = await prisma.task.findFirst({
        where: { id, organizationId: orgId },
      })
      if (!task) throw new AppError('Task not found', 404)

      await prisma.task.delete({ where: { id } })
      await cache.del(cacheKeys.boardTasks(task.boardId))
      io.to(`org:${orgId}`).emit('task:deleted', { id })

      res.json({ success: true, message: 'Task deleted' })
    } catch (err) {
      next(err)
    }
  }
)

// GET /api/tasks/:id/activity
router.get('/:id/activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const orgId = req.organizationId!

    const task = await prisma.task.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!task) throw new AppError('Task not found', 404)

    const logs = await prisma.activityLog.findMany({
      where: { taskId: id },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: logs })
  } catch (err) {
    next(err)
  }
})

export default router