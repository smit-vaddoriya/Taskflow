import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { Server } from 'socket.io'

import { env } from './config/env'
import { connectRedis } from './config/redis'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import { authenticate } from './middleware/auth'

import authRoutes from './routes/auth.routes'
import orgRoutes from './routes/org.routes'
import projectRoutes from './routes/project.routes'
import taskRoutes from './routes/task.routes'
import boardRoutes from './routes/board.routes'
import sprintRoutes from './routes/sprint.routes'
import commentRoutes from './routes/comment.routes'
import notificationRoutes from './routes/notification.routes'
import analyticsRoutes from './routes/analytics.routes'
import aiRoutes from './routes/ai.routes'
import uploadRoutes from './routes/upload.routes'

import { registerSocketHandlers } from './sockets'

const app = express()
const httpServer = http.createServer(app)

export const io = new Server(httpServer, {
  cors: { origin: env.FRONTEND_URL, methods: ['GET', 'POST'], credentials: true },
})

registerSocketHandlers(io)

app.use(helmet())
app.use(compression())
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(rateLimiter)

// Middleware to extract org from header
const extractOrg = (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  const orgId = req.headers['x-org-id'] as string
  if (orgId) req.organizationId = orgId
  next()
}

app.get('/health', (_, res) => res.json({ status: 'ok' }))

// Public routes
app.use('/api/auth', authRoutes)

// Protected routes — authenticate + extractOrg applied inline
app.use('/api/orgs',          authenticate, extractOrg, orgRoutes)
app.use('/api/projects',      authenticate, extractOrg, projectRoutes)
app.use('/api/tasks',         authenticate, extractOrg, taskRoutes)
app.use('/api/boards',        authenticate, extractOrg, boardRoutes)
app.use('/api/sprints',       authenticate, extractOrg, sprintRoutes)
app.use('/api/comments',      authenticate, extractOrg, commentRoutes)
app.use('/api/notifications', authenticate, notificationRoutes)
app.use('/api/analytics',     authenticate, extractOrg, analyticsRoutes)
app.use('/api/ai',            authenticate, extractOrg, aiRoutes)
app.use('/api/upload',        authenticate, extractOrg, uploadRoutes)

app.use(errorHandler)

async function bootstrap() {
  await connectRedis()
  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`)
  })
}

bootstrap().catch((err) => {
  logger.error('Failed to start: ' + err.message)
  process.exit(1)
})