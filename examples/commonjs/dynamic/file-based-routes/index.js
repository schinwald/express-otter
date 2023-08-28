const express = require('express')
const expressWS = require('express-ws')
const { registerRouters } = require('../../../../dist/commonjs/index.js')


async function main () {
  const app = express()
  expressWS(app)

  await registerRouters({
    app,
    paths: ['./src/routes']
  })

  app.listen(4000, () => {
    console.log('Server running at http://localhost:4000')
  })
}

main()
