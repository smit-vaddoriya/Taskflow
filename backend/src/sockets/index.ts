import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export function registerSocketHandlers(io: Server) {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Authentication required'))
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string }
      ;(socket as any).userId = payload.userId
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId

    socket.join(`user:${userId}`)

    socket.on('join:org', (orgId: string) => {
      socket.join(`org:${orgId}`)
    })

    socket.on('join:board', (boardId: string) => {
      socket.join(`board:${boardId}`)
    })

    socket.on('leave:board', (boardId: string) => {
      socket.leave(`board:${boardId}`)
    })

    socket.on('join:task', (taskId: string) => {
      socket.join(`task:${taskId}`)
    })

    socket.on('task:move', ({ taskId, boardId, newPosition, newStatus }: any) => {
      socket.to(`board:${boardId}`).emit('task:moved', { taskId, newPosition, newStatus })
    })

    socket.on('comment:typing', ({ taskId }: { taskId: string }) => {
      socket.to(`task:${taskId}`).emit('comment:user-typing', { userId })
    })

    socket.on('disconnect', () => {})
  })
}