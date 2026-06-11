export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED'
export type Priority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type NotificationType = 'TASK_ASSIGNED' | 'TASK_COMMENT' | 'TASK_DUE_SOON' | 'TASK_OVERDUE' | 'MENTION' | 'INVITE' | 'SPRINT_SUMMARY'

export interface User {
  id: string; email: string; name: string; avatarUrl?: string
  provider?: string; isVerified: boolean; createdAt: string
}

export interface UserBasic { id: string; name: string; avatarUrl?: string }

export interface Organization {
  id: string; name: string; slug: string
  logoUrl?: string; plan: string; createdAt: string
}

export interface OrganizationMember {
  id: string; organizationId: string; userId: string
  role: Role; joinedAt: string; user: UserBasic
}

export interface OrgWithRole extends Organization { role: Role }

export interface Project {
  id: string; organizationId: string; name: string
  description?: string; color: string; icon?: string
  isArchived: boolean; createdAt: string; updatedAt: string
  _count?: { boards: number }
}

export interface Board {
  id: string; projectId: string; name: string
  position: number; color?: string; tasks?: Task[]
}

export interface Sprint {
  id: string; projectId: string; name: string; goal?: string
  startDate: string; endDate: string; isActive: boolean
  isCompleted: boolean; aiSummary?: string; createdAt: string
}

export interface Task {
  id: string; organizationId: string; boardId: string
  sprintId?: string; parentTaskId?: string; title: string
  description?: string; status: TaskStatus; priority: Priority
  position: number; dueDate?: string; estimatedHours?: number
  actualHours?: number; assigneeId?: string; createdById: string
  aiBreakdown?: AIBreakdownResult; aiSuggestedPriority?: Priority
  createdAt: string; updatedAt: string
  assignee?: UserBasic; createdBy?: UserBasic
  subTasks?: SubTask[]; labels?: TaskLabelItem[]
  _count?: { comments: number; attachments: number }
}

export interface SubTask { id: string; title: string; status: TaskStatus }
export interface TaskLabelItem { label: Label }

export interface Label { id: string; projectId: string; name: string; color: string }

export interface Comment {
  id: string; taskId: string; authorId: string; content: string
  isEdited: boolean; createdAt: string; updatedAt: string; author: UserBasic
}

export interface Attachment {
  id: string; taskId: string; fileName: string; fileSize: number
  fileType: string; s3Url: string; uploadedAt: string
}

export interface ActivityLog {
  id: string; taskId: string; userId: string; action: string
  oldValue?: string; newValue?: string; createdAt: string; user: UserBasic
}

export interface Notification {
  id: string; userId: string; type: NotificationType
  title: string; body: string; isRead: boolean; link?: string; createdAt: string
}

export interface AISubTask {
  title: string; description: string; estimatedHours: number; priority: Priority
}

export interface AIBreakdownResult {
  subTasks: AISubTask[]; totalEstimatedHours: number; summary: string
}

export interface AIPrioritySuggestion {
  suggestedPriority: Priority; reasoning: string; confidence: number
}

export interface ParsedTask {
  title: string; description?: string; priority: Priority
  dueDate?: string; assigneeName?: string; labels?: string[]
}

export interface AnalyticsOverview {
  totalTasks: number; completedTasks: number; inProgressTasks: number
  overdueTasks: number; completionRate: number; velocityChange: number; avgBlockedDays: number
}

export interface VelocityDataPoint { date: string; completed: number; created: number }

export interface ApiResponse<T> { success: boolean; data: T; message?: string }

export interface LoginForm { email: string; password: string }
export interface RegisterForm { name: string; email: string; password: string; confirmPassword: string }
export interface CreateOrgForm { name: string; slug: string }
export interface CreateProjectForm { name: string; description?: string; color: string }
export interface CreateTaskForm {
  boardId: string; title: string; description?: string
  priority: Priority; status: TaskStatus; dueDate?: string
  assigneeId?: string; sprintId?: string; estimatedHours?: number
}