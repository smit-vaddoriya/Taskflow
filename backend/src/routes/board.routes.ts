import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { prisma } from '../config/prisma'
import { validate } from '../middleware/validate'
import { requireOrgAccess } from '../middleware/auth'
import { cache, cacheKeys } from '../config/redis'
import { AppError } from '../utils/AppError'

const router = Router()

router.use(requireOrgAccess())

// GET /api/boards?projectId=xxx
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.query
    if (!projectId) throw new AppError('projectId is required', 400)

    const cacheKey = cacheKeys.projectBoards(projectId as string)
    const cached = await cache.get(cacheKey)
    if (cached) return res.json({ success: true, data: cached, cached: true })

    // Verify project belongs to org
    const project = await prisma.project.findFirst({ where: { id: projectId as string, organizationId: req.organizationId! } })
    if (!project) throw new AppError('Project not found', 404)

    const boards = await prisma.board.findMany({
      where: { projectId: projectId as string },
      orderBy: { position: 'asc' },
    })

    await cache.set(cacheKey, boards, 120)
    res.json({ success: true, data: boards })
  } catch (err) { next(err) }
})

// POST /api/boards
router.post(
  '/',
  requireOrgAccess(['OWNER', 'ADMIN', 'MANAGER']),
  [body('projectId').isUUID(), body('name').trim().isLength({ min: 1 })],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId, name, color } = req.body

      const project = await prisma.project.findFirst({ where: { id: projectId, organizationId: req.organizationId! } })
      if (!project) throw new AppError('Project not found', 404)

      const lastBoard = await prisma.board.findFirst({ where: { projectId }, orderBy: { position: 'desc' }, select: { position: true } })

      const board = await prisma.board.create({
        data: { projectId, name, color, position: (lastBoard?.position ?? 0) + 1 },
      })

      await cache.del(cacheKeys.projectBoards(projectId))
      res.status(201).json({ success: true, data: board })
    } catch (err) { next(err) }
  }
)

// PATCH /api/boards/:id
router.patch('/:id', requireOrgAccess(['OWNER', 'ADMIN', 'MANAGER']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const board = await prisma.board.findUnique({ where: { id: req.params.id } })
    if (!board) throw new AppError('Board not found', 404)

    const { name, color, position } = req.body
    const updated = await prisma.board.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(position !== undefined && { position }),
      },
    })
    await cache.del(cacheKeys.projectBoards(board.projectId))
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// DELETE /api/boards/:id
router.delete('/:id', requireOrgAccess(['OWNER', 'ADMIN', 'MANAGER']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const board = await prisma.board.findUnique({ where: { id: req.params.id } })
    if (!board) throw new AppError('Board not found', 404)
    await prisma.board.delete({ where: { id: req.params.id } })
    await cache.del(cacheKeys.projectBoards(board.projectId))
    res.json({ success: true, message: 'Board deleted' })
  } catch (err) { next(err) }
})

export default router