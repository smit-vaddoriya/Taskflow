import path from 'path'
import fs from 'fs'

export function getUploadPath(filename: string): string {
  return path.join(process.cwd(), 'uploads', filename)
}

export function deleteLocalFile(filename: string): void {
  try {
    const filePath = getUploadPath(filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (err) {
    console.error('[UPLOAD] Failed to delete file:', err)
  }
}

export function ensureUploadDir(): void {
  const uploadDir = path.join(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
}