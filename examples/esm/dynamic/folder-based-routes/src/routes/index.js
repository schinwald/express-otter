import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateURL } from '../../../../../../dist/esm/index.js'

const __filename = fileURLToPath(import.meta.url)
const url = generateURL()
const router = express.Router()

router.get(url, (req, res) => {
  res.send(path.relative(process.cwd(), __filename))
})

export default router
