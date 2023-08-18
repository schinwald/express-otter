const express = require('express')
const path = require('path')

const router = express.Router()

router.get('/', (req, res) => {
  res.send(path.relative(process.cwd(), __filename))
})

module.exports = router
