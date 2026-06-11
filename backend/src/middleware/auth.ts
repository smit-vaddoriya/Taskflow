import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { prisma } from '../config/prisma'
import { AppError } from '../utils/AppError'

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; name: string }
      organizationId?: string
      memberRole?: string
    }
  }
}

interface JwtPayload {
  userId: string
  email: string
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401)
    }

    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    })

    if (!user) throw new AppError('User not found', 401)

    req.user = user
    next()
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401))
    } else {
      next(err)
    }
  }
}

export const requireOrgAccess = (allowedRoles?: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const orgId = req.organizationId
      const userId = req.user?.id

      if (!orgId || !userId) throw new AppError('Unauthorized', 401)

      const membership = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: orgId, userId } },
      })

      if (!membership) throw new AppError('Not a member of this organization', 403)

      if (allowedRoles && !allowedRoles.includes(membership.role)) {
        throw new AppError('Insufficient permissions', 403)
      }

      req.memberRole = membership.role
      next()
    } catch (err) {
      next(err)
    }
  }
}