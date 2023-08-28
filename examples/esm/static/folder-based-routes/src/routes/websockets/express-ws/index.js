import express from 'express'

const router = express.Router()

router.ws('/websockets/express-ws', (ws, req) => {
  ws.on('message', (data) => {
    ws.send(data)
  })
})

export default router
