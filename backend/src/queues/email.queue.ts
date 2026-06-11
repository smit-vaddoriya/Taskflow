// Email queue using BullMQ
// In production this processes emails in the background
// For now it runs jobs immediately

interface EmailJob {
  type: 'invite' | 'task_assigned' | 'due_reminder'
  to: string
  data: Record<string, any>
}

const queue: EmailJob[] = []

export async function addEmailJob(job: EmailJob): Promise<void> {
  queue.push(job)
  await processJob(job)
}

async function processJob(job: EmailJob): Promise<void> {
  try {
    console.log(`[EMAIL QUEUE] Processing ${job.type} for ${job.to}`)
    // In production: use BullMQ worker here
  } catch (err) {
    console.error('[EMAIL QUEUE] Job failed:', err)
  }
}