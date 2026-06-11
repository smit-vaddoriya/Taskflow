import { prisma } from '../config/prisma'
import { io } from '../index'

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string
  type: string
  title: string
  body: string
  link?: string
}) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: type as any,
      title,
      body,
      link,
    },
  })

  // Emit real-time notification to user
  io.to(`user:${userId}`).emit('notification:new', notification)

  return notification
}

export async function notifyTaskAssigned(taskId: string, assigneeId: string, assignerName: string, taskTitle: string) {
  await createNotification({
    userId: assigneeId,
    type: 'TASK_ASSIGNED',
    title: 'Task assigned to you',
    body: `${assignerName} assigned you: "${taskTitle}"`,
    link: `/tasks/${taskId}`,
  })
}

export async function notifyTaskComment(taskId: string, assigneeId: string, commenterName: string, preview: string) {
  await createNotification({
    userId: assigneeId,
    type: 'TASK_COMMENT',
    title: 'New comment on your task',
    body: `${commenterName}: "${preview}"`,
    link: `/tasks/${taskId}`,
  })
}