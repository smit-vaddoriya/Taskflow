import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/prisma'

const router = Router()

// GET /api/notifications — user's own notifications (no org needed)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ success: true, data: notifications })
  } catch (err) { next(err) }
})

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// DELETE /api/notifications/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id, userId: req.user!.id },
    })
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router