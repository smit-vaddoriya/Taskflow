import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@taskflow.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@taskflow.com',
      passwordHash,
      provider: 'local',
      isVerified: true,
    },
  })

  // Create demo org
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: { name: 'Demo Workspace', slug: 'demo-workspace', plan: 'free' },
  })

  // Add user as owner
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: {},
    create: { organizationId: org.id, userId: user.id, role: 'OWNER' },
  })

  // Create demo project
  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'My First Project',
      description: 'A demo project to get you started',
      color: '#6366f1',
    },
  })

  // Create boards
  const boards = await Promise.all([
    prisma.board.create({ data: { projectId: project.id, name: 'To Do',      position: 1, color: '#64748b' } }),
    prisma.board.create({ data: { projectId: project.id, name: 'In Progress', position: 2, color: '#3b82f6' } }),
    prisma.board.create({ data: { projectId: project.id, name: 'Done',        position: 3, color: '#22c55e' } }),
  ])

  // Create sample tasks
  await Promise.all([
    prisma.task.create({
      data: {
        organizationId: org.id,
        boardId: boards[0].id,
        title: 'Set up project structure',
        description: 'Initialize the project with all necessary folders and config files',
        status: 'TODO',
        priority: 'HIGH',
        position: 1000,
        createdById: user.id,
        assigneeId: user.id,
      },
    }),
    prisma.task.create({
      data: {
        organizationId: org.id,
        boardId: boards[0].id,
        title: 'Design database schema',
        description: 'Create the Prisma schema with all models',
        status: 'TODO',
        priority: 'MEDIUM',
        position: 2000,
        createdById: user.id,
      },
    }),
    prisma.task.create({
      data: {
        organizationId: org.id,
        boardId: boards[1].id,
        title: 'Build authentication system',
        description: 'JWT-based auth with refresh tokens',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        position: 1000,
        createdById: user.id,
        assigneeId: user.id,
        estimatedHours: 8,
      },
    }),
    prisma.task.create({
      data: {
        organizationId: org.id,
        boardId: boards[2].id,
        title: 'Project setup complete',
        status: 'DONE',
        priority: 'LOW',
        position: 1000,
        createdById: user.id,
        assigneeId: user.id,
      },
    }),
  ])

  console.log('✅ Seed complete!')
  console.log('📧 Demo login: demo@taskflow.com')
  console.log('🔑 Password:   password123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())