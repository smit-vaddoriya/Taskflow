import { Router, Request, Response, NextFunction } from 'express'
import { body, param } from 'express-validator'
import { prisma } from '../config/prisma'
import { validate } from '../middleware/validate'
import { requireOrgAccess } from '../middleware/auth'
import { AppError } from '../utils/AppError'

const router = Router()

router.use(requireOrgAccess())

// GET /api/projects
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await prisma.project.findMany({
      where: { organizationId: req.organizationId!, isArchived: false },
      include: { _count: { select: { boards: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: projects })
  } catch (err) { next(err) }
})

// GET /api/projects/:id
router.get('/:id', [param('id').isUUID()], validate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId! },
      include: { _count: { select: { boards: true } }, labels: true },
    })
    if (!project) throw new AppError('Project not found', 404)
    res.json({ success: true, data: project })
  } catch (err) { next(err) }
})

// POST /api/projects
router.post(
  '/',
  requireOrgAccess(['OWNER', 'ADMIN', 'MANAGER']),
  [body('name').trim().isLength({ min: 1 }), body('color').optional().isHexColor()],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, color = '#6366f1', icon } = req.body
      const project = await prisma.project.create({
        data: { organizationId: req.organizationId!, name, description, color, icon },
      })
      res.status(201).json({ success: true, data: project })
    } catch (err) { next(err) }
  }
)

// PATCH /api/projects/:id
router.patch('/:id', requireOrgAccess(['OWNER', 'ADMIN', 'MANAGER']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, organizationId: req.organizationId! } })
    if (!project) throw new AppError('Project not found', 404)

    const { name, description, color, icon, isArchived } = req.body
    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(isArchived !== undefined && { isArchived }),
      },
    })
    res.json({ success: true, data: updated })
  } catch (err) { next(err) }
})

// DELETE /api/projects/:id
router.delete('/:id', requireOrgAccess(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, organizationId: req.organizationId! } })
    if (!project) throw new AppError('Project not found', 404)
    await prisma.project.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Project deleted' })
  } catch (err) { next(err) }
})

// POST /api/projects/:id/labels
router.post('/:id/labels', requireOrgAccess(['OWNER', 'ADMIN', 'MANAGER']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, color } = req.body
    const label = await prisma.label.create({ data: { projectId: req.params.id, name, color } })
    res.status(201).json({ success: true, data: label })
  } catch (err) { next(err) }
})

export default router