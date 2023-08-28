import express from 'express'
import { generateURL } from '../../../../../../../../dist/esm/index.js'

const url = generateURL()
const router = express.Router()

router.ws(url, (ws, req) => {
  ws.on('message', (data) => {
    ws.send(data)
  })
})

export default router
