import express from 'express'
import path from 'path'

const router = express.Router()

router.get('/pets/:pet', (req, res) => {
  res.send(path.relative(process.cwd(), __filename))
})

export default router
