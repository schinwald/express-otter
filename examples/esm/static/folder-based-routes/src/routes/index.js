import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

const router = express.Router()

router.get('/', (req, res) => {
  res.send(path.relative(process.cwd(), __filename))
})

export default router
