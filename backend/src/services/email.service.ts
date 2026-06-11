export async function sendInviteEmail(to: string, orgName: string, inviteToken: string, inviterName: string) {
  const inviteUrl = `${process.env.FRONTEND_URL}/invite/${inviteToken}`
  console.log(`[EMAIL] Invite email to ${to}`)
  console.log(`[EMAIL] ${inviterName} invited you to ${orgName}`)
  console.log(`[EMAIL] Accept at: ${inviteUrl}`)
  // In production: use Resend or Nodemailer here
}

export async function sendTaskAssignedEmail(to: string, taskTitle: string, assignerName: string) {
  console.log(`[EMAIL] Task assigned email to ${to}`)
  console.log(`[EMAIL] ${assignerName} assigned you: ${taskTitle}`)
}

export async function sendDueDateReminderEmail(to: string, taskTitle: string, dueDate: string) {
  console.log(`[EMAIL] Due date reminder to ${to}`)
  console.log(`[EMAIL] Task "${taskTitle}" is due on ${dueDate}`)
}