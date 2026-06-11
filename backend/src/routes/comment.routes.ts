import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { prisma } from '../config/prisma'
import { validate } from '../middleware/validate'
import { requireOrgAccess } from '../middleware/auth'
import { AppError } from '../utils/AppError'
import { io } from '../index'

const router = Router()

router.use(requireOrgAccess())

// GET /api/comments?taskId=xxx
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.query
    if (!taskId) throw new AppError('taskId required', 400)

    const comments = await prisma.comment.findMany({
      where: { taskId: taskId as string },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ success: true, data: comments })
  } catch (err) { next(err) }
})

// POST /api/comments
router.post(
  '/',
  [body('taskId').isUUID(), body('content').trim().isLength({ min: 1 })],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { taskId, content } = req.body
      const orgId = req.organizationId!

      const task = await prisma.task.findFirst({ where: { id: taskId, organizationId: orgId } })
      if (!task) throw new AppError('Task not found', 404)

      const comment = await prisma.comment.create({
        data: { taskId, authorId: req.user!.id, content },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      })

      // Notify task assignee if different from commenter
      if (task.assigneeId && task.assigneeId !== req.user!.id) {
        await prisma.notification.create({
          data: {
            userId: task.assigneeId,
            type: 'TASK_COMMENT',
            title: 'New comment on your task',
            body: `${req.user!.name} commented: "${content.slice(0, 80)}"`,
            link: `/tasks/${taskId}`,
          },
        })
        io.to(`user:${task.assigneeId}`).emit('notification:new', {})
      }

      io.to(`task:${taskId}`).emit('comment:new', comment)
      res.status(201).json({ success: true, data: comment })
    } catch (err) { next(err) }
  }
)

// PATCH /api/comments/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } })
    if (!comment) throw new AppError('Comment not found', 404)
    if (comment.authorId !== req.user!.id) throw new AppError('Not your comment', 403)

    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { content: req.body.content, isEdited: true },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// DELETE /api/comments/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } })
    if (!comment) throw new AppError('Comment not found', 404)
    if (comment.authorId !== req.user!.id && req.memberRole !== 'OWNER' && req.memberRole !== 'ADMIN') {
      throw new AppError('Not authorized', 403)
    }
    await prisma.comment.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Comment deleted' })
  } catch (err) { next(err) }
})

export default router