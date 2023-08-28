const express = require('express')
const generateURL = require('../../../../../../../../dist/commonjs/index.js').generateURL

const url = generateURL()
const router = express.Router()

router.ws(url, (ws, req) => {
  ws.on('message', (data) => {
    ws.send(data)
  })
})

module.exports = router
