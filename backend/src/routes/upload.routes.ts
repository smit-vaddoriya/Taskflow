import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { requireOrgAccess } from '../middleware/auth'
import { prisma } from '../config/prisma'
import { AppError } from '../utils/AppError'

const router = Router()

// Local disk storage for development
// In production, swap to multer-s3
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf','text/plain','application/zip']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('File type not allowed'))
  },
})

router.use(requireOrgAccess())

// POST /api/upload/task/:taskId
router.post('/task/:taskId', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400)

    const task = await prisma.task.findFirst({
      where: { id: req.params.taskId, organizationId: req.organizationId! },
    })
    if (!task) throw new AppError('Task not found', 404)

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`

    const attachment = await prisma.attachment.create({
      data: {
        taskId: req.params.taskId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        s3Key: req.file.filename,
        s3Url: fileUrl,
      },
    })

    res.status(201).json({ success: true, data: attachment })
  } catch (err) { next(err) }
})

// DELETE /api/upload/attachment/:id
router.delete('/attachment/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.attachment.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Attachment deleted' })
  } catch (err) { next(err) }
})

export default router