import { expect, test } from 'bun:test'
import express from 'express'
import { registerRouters } from '../../../index'

test('test dynamic file-based routes', async () => {
  await new Promise(async (resolve) => {
    const app = express()

    await registerRouters({
      app,
      paths: ['./tests/utils/servers/dynamic/file-based-routes'],
      dynamic: false,
      beforeRegister: ({ path }) => {
        console.log(path)
      }
    })

    app.listen(3003, async () => {
      resolve('done')
    })
  })

  let response

  response = await fetch('http://localhost:3003/pets')
  expect(response.status).toBe(200)
  expect(await response.text()).toBe('tests/utils/servers/dynamic/file-based-routes/pets.ts')

  response = await fetch('http://localhost:3003/pets/dog')
  expect(response.status).toBe(200)
  expect(await response.text()).toBe('tests/utils/servers/dynamic/file-based-routes/pets/[pet].ts')
})
