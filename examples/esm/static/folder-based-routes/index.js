import express from 'express'
import expressWS from 'express-ws'
import { registerRouters } from '../../../../dist/esm/index.js'


const app = express()
expressWS(app)

await registerRouters({
  app,
  paths: ['./src/routes']
})

app.listen(4000, () => {
  console.log('Server running at http://localhost:4000')
})
