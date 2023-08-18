const express = require('express')
const path = require('path')
const { generateURL } = require('../../../../../../dist/commonjs/index.js')

const url = generateURL()
const router = express.Router()

router.get(url, (req, res) => {
  res.send(path.relative(process.cwd(), __filename))
})

module.exports = router
