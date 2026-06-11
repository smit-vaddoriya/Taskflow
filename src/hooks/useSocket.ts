import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { useQueryClient } from '@tanstack/react-query'

let socket: Socket | null = null

export function useSocket() {
  const { token, currentOrg } = useAuthStore()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token || !currentOrg) return

    if (socket) {
      socket.disconnect()
      socket = null
    }

    socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 3000,
      timeout: 10000,
    })

    socket.on('connect', () => {
      socket?.emit('join:org', currentOrg.id)
    })

    // Completely suppress all socket errors from console
    socket.on('connect_error', () => {})
    socket.io.on('error', () => {})
    socket.io.on('reconnect_error', () => {})
    socket.io.on('reconnect_failed', () => {})

    socket.on('task:created', (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.boardId] })
    })

    socket.on('task:updated', (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.boardId] })
      queryClient.invalidateQueries({ queryKey: ['task', task.id] })
    })

    socket.on('task:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    })

    socket.on('notification:new', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    })

    return () => {
      socket?.disconnect()
      socket = null
    }
  }, [token, currentOrg?.id])
}