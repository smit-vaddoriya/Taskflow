import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { prisma } from '../config/prisma'
import { validate } from '../middleware/validate'
import { requireOrgAccess } from '../middleware/auth'
import { cache, cacheKeys } from '../config/redis'
import { AppError } from '../utils/AppError'

const router = Router()

// ─── GET /api/orgs ────────────────────────────────────────────
// List all orgs the current user belongs to
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: req.user!.id },
      include: { organization: true },
    })
    const orgs = memberships.map(m => ({ ...m.organization, role: m.role }))
    res.json({ success: true, data: orgs })
  } catch (err) { next(err) }
})

// ─── POST /api/orgs ───────────────────────────────────────────
// Create a new org — current user becomes OWNER
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2 }),
    body('slug').trim().matches(/^[a-z0-9-]+$/),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, slug } = req.body

      const existing = await prisma.organization.findUnique({ where: { slug } })
      if (existing) throw new AppError('Slug already taken', 409)

      const org = await prisma.organization.create({ data: { name, slug } })

      await prisma.organizationMember.create({
        data: { organizationId: org.id, userId: req.user!.id, role: 'OWNER' },
      })

      res.status(201).json({ success: true, data: { ...org, role: 'OWNER' } })
    } catch (err) { next(err) }
  }
)

// ─── PATCH /api/orgs/:id ──────────────────────────────────────
// Update org name / settings — ADMIN+
router.patch(
  '/:id',
  requireOrgAccess(['OWNER', 'ADMIN']),
  [body('name').optional().trim().isLength({ min: 2 })],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body
      const org = await prisma.organization.update({
        where: { id: req.params.id },
        data: { ...(name && { name }) },
      })
      res.json({ success: true, data: org })
    } catch (err) { next(err) }
  }
)

// ─── GET /api/orgs/members ────────────────────────────────────
// List all members of current org
router.get('/members', requireOrgAccess(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!

    const cached = await cache.get(cacheKeys.orgMembers(orgId))
    if (cached) return res.json({ success: true, data: cached, cached: true })

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, email: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })

    await cache.set(cacheKeys.orgMembers(orgId), members, 120)
    res.json({ success: true, data: members })
  } catch (err) { next(err) }
})

// ─── GET /api/orgs/invites ────────────────────────────────────
// List pending (not accepted, not expired) invites — ADMIN+
router.get('/invites', requireOrgAccess(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId      = req.organizationId!
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001'

    const invites = await prisma.invite.findMany({
      where: {
        organizationId: orgId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = invites.map(inv => ({
      id:        inv.id,
      email:     inv.email,
      role:      inv.role,
      token:     inv.token,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      inviteUrl: `${frontendUrl}/invite/${inv.token}`,
    }))

    res.json({ success: true, data })
  } catch (err) { next(err) }
})

// ─── POST /api/orgs/invite ────────────────────────────────────
// Create invite and return the invite URL — ADMIN+
router.post(
  '/invite',
  requireOrgAccess(['OWNER', 'ADMIN']),
  [
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['VIEWER', 'MEMBER', 'MANAGER', 'ADMIN']),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body
      const orgId           = req.organizationId!
      const frontendUrl     = process.env.FRONTEND_URL ?? 'http://localhost:3001'

      // Check if user already exists and is already a member
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        const alreadyMember = await prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: orgId,
              userId: existingUser.id,
            },
          },
        })
        if (alreadyMember) {
          throw new AppError('This user is already a member of your workspace', 409)
        }
      }

      // Cancel any previous pending invites for this email in this org
      await prisma.invite.deleteMany({
        where: { organizationId: orgId, email, acceptedAt: null },
      })

      // Create the invite
      const invite = await prisma.invite.create({
        data: {
          organizationId: orgId,
          email,
          role,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        include: { organization: true },
      })

      const inviteUrl = `${frontendUrl}/invite/${invite.token}`

      // Log to terminal — useful during dev
      console.log(`\n✉️  INVITE CREATED`)
      console.log(`   Email:   ${email}`)
      console.log(`   Org:     ${invite.organization.name}`)
      console.log(`   Role:    ${role}`)
      console.log(`   Link:    ${inviteUrl}`)
      console.log(`   Expires: ${invite.expiresAt.toLocaleDateString()}\n`)

      // If the invited user already has a TaskFlow account,
      // send them an in-app notification so they see it in the bell
      if (existingUser) {
        try {
          const inviter = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: { name: true },
          })

          const { createNotification } = await import('../services/notification.service')
          await createNotification({
            userId: existingUser.id,
            type:   'INVITE',
            title:  `${inviter?.name ?? 'Someone'} invited you to join`,
            body:   `Join "${invite.organization.name}" as ${role.charAt(0) + role.slice(1).toLowerCase()}`,
            link:   invite.token,
          })
        } catch (notifError) {
          // Don't fail the invite if notification creation fails
          console.error('[INVITE] Could not create notification:', notifError)
        }
      }

      res.status(201).json({
        success: true,
        data: {
          id:        invite.id,
          email:     invite.email,
          role:      invite.role,
          token:     invite.token,
          expiresAt: invite.expiresAt,
          createdAt: invite.createdAt,
          inviteUrl, // ← the key field the frontend needs
        },
      })
    } catch (err) { next(err) }
  }
)

// ─── POST /api/orgs/invite/:token/accept ─────────────────────
// Accept an invite — user must be authenticated
router.post('/invite/:token/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invite = await prisma.invite.findUnique({
      where: { token: req.params.token },
      include: { organization: true },
    })

    if (!invite)            throw new AppError('Invalid invite link', 404)
    if (invite.expiresAt < new Date()) throw new AppError('This invite has expired', 410)
    if (invite.acceptedAt)  throw new AppError('This invite has already been used', 409)

    // Check not already a member
    const existing = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invite.organizationId,
          userId:         req.user!.id,
        },
      },
    })
    if (existing) throw new AppError('You are already a member of this workspace', 409)

    // Add to org
    await prisma.organizationMember.create({
      data: {
        organizationId: invite.organizationId,
        userId:         req.user!.id,
        role:           invite.role,
      },
    })

    // Mark invite as used
    await prisma.invite.update({
      where: { id: invite.id },
      data:  { acceptedAt: new Date() },
    })

    // Clear member cache so the new member appears immediately
    await cache.del(cacheKeys.orgMembers(invite.organizationId))

    res.json({
      success: true,
      message: `You joined "${invite.organization.name}" successfully`,
      data: {
        organizationId:   invite.organizationId,
        organizationName: invite.organization.name,
        role:             invite.role,
      },
    })
  } catch (err) { next(err) }
})

// ─── DELETE /api/orgs/invites/:id ────────────────────────────
// Cancel/revoke a pending invite — ADMIN+
router.delete('/invites/:id', requireOrgAccess(['OWNER', 'ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organizationId!

    await prisma.invite.deleteMany({
      where: { id: req.params.id, organizationId: orgId },
    })

    res.json({ success: true, message: 'Invite revoked' })
  } catch (err) { next(err) }
})

// ─── PATCH /api/orgs/members/:userId/role ────────────────────
// Change a member's role — OWNER only (can't change roles above yourself)
router.patch(
  '/members/:userId/role',
  requireOrgAccess(['OWNER', 'ADMIN']),
  [body('role').isIn(['VIEWER', 'MEMBER', 'MANAGER', 'ADMIN'])],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId  = req.organizationId!
      const { role } = req.body

      // Prevent changing your own role
      if (req.params.userId === req.user!.id) {
        throw new AppError('You cannot change your own role', 400)
      }

      // Get current requester's role
      const requester = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: orgId, userId: req.user!.id } },
      })

      // Only OWNER can assign ADMIN
      if (role === 'ADMIN' && requester?.role !== 'OWNER') {
        throw new AppError('Only the workspace owner can assign Admin role', 403)
      }

      await prisma.organizationMember.update({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: req.params.userId,
          },
        },
        data: { role },
      })

      await cache.del(cacheKeys.orgMembers(orgId))
      res.json({ success: true, message: 'Role updated successfully' })
    } catch (err) { next(err) }
  }
)

// ─── DELETE /api/orgs/members/:userId ────────────────────────
// Remove a member from the org — ADMIN+
router.delete(
  '/members/:userId',
  requireOrgAccess(['OWNER', 'ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = req.organizationId!

      // Cannot remove yourself
      if (req.params.userId === req.user!.id) {
        throw new AppError('You cannot remove yourself from the workspace', 400)
      }

      // Cannot remove the OWNER
      const targetMember = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: orgId, userId: req.params.userId } },
      })
      if (targetMember?.role === 'OWNER') {
        throw new AppError('The workspace owner cannot be removed', 403)
      }

      await prisma.organizationMember.delete({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: req.params.userId,
          },
        },
      })

      await cache.del(cacheKeys.orgMembers(orgId))
      res.json({ success: true, message: 'Member removed successfully' })
    } catch (err) { next(err) }
  }
)

export default router