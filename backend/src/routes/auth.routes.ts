import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma'
import { validate } from '../middleware/validate'
import { authenticate } from '../middleware/auth'
import { env } from '../config/env'
import { AppError } from '../utils/AppError'

const router = Router()

function generateTokens(userId: string, email: string) {
  const token = jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any })
  const refreshToken = jwt.sign({ userId, email }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any })
  return { token, refreshToken }
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) throw new AppError('Email already in use', 409)

      const passwordHash = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: { name, email, passwordHash, provider: 'local', isVerified: false },
        select: { id: true, name: true, email: true, avatarUrl: true, isVerified: true, createdAt: true },
      })

      const { token, refreshToken } = generateTokens(user.id, user.email)

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      const memberships = await prisma.organizationMember.findMany({
        where: { userId: user.id },
        include: { organization: true },
      })

      res.status(201).json({
        success: true,
        data: {
          user,
          token,
          refreshToken,
          organizations: memberships.map((m) => ({ ...m.organization, role: m.role })),
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user || !user.passwordHash) throw new AppError('Invalid email or password', 401)

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) throw new AppError('Invalid email or password', 401)

      const { token, refreshToken } = generateTokens(user.id, user.email)

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      const memberships = await prisma.organizationMember.findMany({
        where: { userId: user.id },
        include: { organization: true },
      })

      const { passwordHash: _, ...safeUser } = user

      res.json({
        success: true,
        data: {
          user: safeUser,
          token,
          refreshToken,
          organizations: memberships.map((m) => ({ ...m.organization, role: m.role })),
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw new AppError('Refresh token required', 400)

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date()) throw new AppError('Invalid or expired refresh token', 401)

    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string; email: string }
    const { token: newToken, refreshToken: newRefresh } = generateTokens(payload.userId, payload.email)

    // Use deleteMany instead of delete to avoid crash if already deleted
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    await prisma.refreshToken.create({
      data: {
        token: newRefresh,
        userId: payload.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.json({ success: true, data: { token: newToken, refreshToken: newRefresh } })
  } catch (err) {
    next(err)
  }
})
// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, avatarUrl: true, isVerified: true, createdAt: true },
    })
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/auth/me
router.patch('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, avatarUrl } = req.body
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(avatarUrl && { avatarUrl }),
      },
      select: { id: true, name: true, email: true, avatarUrl: true, isVerified: true, createdAt: true },
    })
    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    }
    res.json({ success: true, message: 'Logged out' })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/auth/me/password
router.patch('/me/password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      throw new AppError('Both current and new password are required', 400)
    }
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters', 400)
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user || !user.passwordHash) throw new AppError('User not found', 404)

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) throw new AppError('Current password is incorrect', 401)

    const newHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash: newHash },
    })

    // Invalidate all existing refresh tokens for security
    await prisma.refreshToken.deleteMany({ where: { userId: req.user!.id } })

    res.json({ success: true, message: 'Password changed successfully' })
  } catch (err) {
    next(err)
  }
})

export default router