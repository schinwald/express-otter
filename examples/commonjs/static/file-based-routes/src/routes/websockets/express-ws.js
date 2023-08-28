const express = require('express')

const router = express.Router()

router.ws('/websockets/express-ws', (ws, req) => {
  ws.on('message', (data) => {
    ws.send(data)
  })
})

module.exports = router
