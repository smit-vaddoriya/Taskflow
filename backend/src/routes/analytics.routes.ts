import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/prisma'
import { requireOrgAccess } from '../middleware/auth'

const router = Router()

router.use(requireOrgAccess())

// GET /api/analytics/overview
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!
    const now   = new Date()

    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - 7)

    const lastWeekStart = new Date(now)
    lastWeekStart.setDate(now.getDate() - 14)
    const lastWeekEnd = new Date(thisWeekStart)

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      thisWeekCompleted,
      lastWeekCompleted,
    ] = await Promise.all([
      prisma.task.count({
        where: { organizationId: orgId },
      }),
      prisma.task.count({
        where: { organizationId: orgId, status: 'DONE' },
      }),
      prisma.task.count({
        where: { organizationId: orgId, status: { in: ['IN_PROGRESS', 'IN_REVIEW'] } },
      }),
      prisma.task.count({
        where: {
          organizationId: orgId,
          dueDate: { lt: now },
          status: { notIn: ['DONE', 'CANCELLED'] },
        },
      }),
      prisma.task.count({
        where: {
          organizationId: orgId,
          status: 'DONE',
          updatedAt: { gte: thisWeekStart },
        },
      }),
      prisma.task.count({
        where: {
          organizationId: orgId,
          status: 'DONE',
          updatedAt: { gte: lastWeekStart, lt: lastWeekEnd },
        },
      }),
    ])

    const completionRate = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0

    // Velocity change calculation — handles all edge cases cleanly
    let velocityChange = 0

    if (thisWeekCompleted > 0 && lastWeekCompleted > 0) {
      // Both weeks have data — show real percentage change
      velocityChange = Math.round(
        ((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100
      )
      // Cap at reasonable bounds
      velocityChange = Math.max(-99, Math.min(200, velocityChange))
    } else if (thisWeekCompleted > 0 && lastWeekCompleted === 0) {
      // New activity this week, nothing last week — show positive momentum
      velocityChange = Math.min(thisWeekCompleted * 10, 100)
    } else {
      // No completions this week (or both zero) — show 0, not -100
      velocityChange = 0
    }

    res.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate,
        velocityChange,
        avgBlockedDays: 0,
      },
    })
  } catch (err) { next(err) }
})

// GET /api/analytics/velocity — last 7 days created vs completed
router.get('/velocity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!
    const days  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const result = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)

      const [created, completed] = await Promise.all([
        prisma.task.count({
          where: {
            organizationId: orgId,
            createdAt: { gte: date, lt: nextDate },
          },
        }),
        prisma.task.count({
          where: {
            organizationId: orgId,
            status: 'DONE',
            updatedAt: { gte: date, lt: nextDate },
          },
        }),
      ])

      result.push({ date: days[date.getDay()], created, completed })
    }

    res.json({ success: true, data: result })
  } catch (err) { next(err) }
})

// GET /api/analytics/members — per-member task stats
router.get('/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    const stats = await Promise.all(
      members.map(async m => {
        const [assigned, completed] = await Promise.all([
          prisma.task.count({
            where: { organizationId: orgId, assigneeId: m.userId },
          }),
          prisma.task.count({
            where: { organizationId: orgId, assigneeId: m.userId, status: 'DONE' },
          }),
        ])
        return {
          userId:    m.userId,
          name:      m.user.name,
          avatarUrl: m.user.avatarUrl,
          assigned,
          completed,
        }
      })
    )

    // Only return members who have at least 1 assigned task
    res.json({
      success: true,
      data: stats.filter(s => s.assigned > 0),
    })
  } catch (err) { next(err) }
})

export default router