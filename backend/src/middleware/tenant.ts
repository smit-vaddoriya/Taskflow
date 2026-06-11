import { Request, Response, NextFunction } from 'express'
import { authenticate } from './auth'
import { AppError } from '../utils/AppError'

const extractOrg = (req: Request, _res: Response, next: NextFunction) => {
  const orgId = req.headers['x-org-id'] as string
  if (!orgId) return next(new AppError('Missing organization context', 400))
  req.organizationId = orgId
  next()
}

export const tenantMiddleware = [authenticate, extractOrg]