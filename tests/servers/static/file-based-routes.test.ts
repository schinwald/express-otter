import { expect, test } from 'bun:test'
import express from 'express'
import { registerRouters } from '../../../index'

test('test static file-based routes', async () => {
  await new Promise(async (resolve) => {
    const app = express()

    await registerRouters({
      app,
      paths: ['../../../tests/utils/servers/static/file-based-routes'],
      beforeRegister: ({ path }) => {
        console.log(path)
      }
    })

    app.listen(3001, async () => {
      resolve('done')
    })
  })

  let response

  response = await fetch('http://localhost:3001/pets')
  expect(response.status).toBe(200)
  expect(await response.text()).toBe('tests/utils/servers/static/file-based-routes/pets.ts')

  response = await fetch('http://localhost:3001/pets/dog')
  expect(response.status).toBe(200)
  expect(await response.text()).toBe('tests/utils/servers/static/file-based-routes/pets/[pet].ts')
})
