import express from 'express'
import path from 'path'
import { generateURL } from '../../../../..'

const router = express.Router()

router.get(generateURL(), (req, res) => {
  res.send(path.relative(process.cwd(), __filename))
})

export default router
