# TaskFlow

A task management platform I built to learn how production SaaS applications actually work under the hood. Not just a todo app — multi-tenant workspaces, role-based permissions, real-time updates, and AI features built on top of a proper backend architecture.

## What it does

Teams can create workspaces, invite members with different roles, and manage work on Kanban boards. Everything updates in real time. There's an AI assistant powered by Groq (Llama 3.3 70B) that can answer questions about your tasks and create new ones from plain English.

Roles: Owner → Admin → Manager → Member → Viewer. Each role has different permissions enforced on both the frontend and backend.

AI features:
- Chat with AI about your tasks ("what's overdue?", "show team velocity")
- Create tasks by describing them in plain English
- Analytics insights generated from real workspace data

## Tech stack

Frontend
- React 19, TypeScript, Vite
- TanStack Query v5 for data fetching and caching
- Zustand for state management
- dnd-kit for drag and drop
- Socket.io client for real-time updates
- Recharts for analytics visualizations

Backend
- Node.js, Express, TypeScript
- Prisma ORM with PostgreSQL
- Redis for caching and session management
- Socket.io for real-time events
- BullMQ for background job queues
- JWT authentication with refresh token rotation
- Groq SDK for AI (Llama 3.3 70B)

Infrastructure
- Docker Compose for local PostgreSQL and Redis
- Multi-tenant data isolation at the database level
- Rate limiting on all routes, stricter limits on AI endpoints

## Running locally

You need Node.js 18+ and Docker Desktop.

```bash
# Clone
git clone https://github.com/smit-vaddoriya/Taskflow.git
cd Taskflow

# Start database and Redis
docker compose up -d postgres redis

# Backend
cd backend
cp ../.env.example .env
# Add your GROQ_API_KEY to .env (free at console.groq.com)
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (new terminal)
cd ..
npm install
npm run dev
```

Open `http://localhost:3001`

Demo account: `demo@taskflow.com` / `password123`

## Environment variables

Copy `.env.example` to `backend/.env`:
