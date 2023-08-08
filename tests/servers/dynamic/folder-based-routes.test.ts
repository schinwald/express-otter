import { expect, test } from 'bun:test'
import express from 'express'
import { registerRouters } from '../../../index'

test('test dynamic folder-based routes', async () => {
  await new Promise(async (resolve) => {
    const app = express()

    await registerRouters({
      app,
      paths: ['./tests/utils/servers/dynamic/folder-based-routes'],
      dynamic: false,
      beforeRegister: ({ path }) => {
        console.log(path)
      }
    })

    app.listen(3004, async () => {
      resolve('done')
    })
  })

  let response

  response = await fetch('http://localhost:3004/pets')
  expect(response.status).toBe(200)
  expect(await response.text()).toBe('tests/utils/servers/dynamic/folder-based-routes/pets/index.ts')

  response = await fetch('http://localhost:3004/pets/dog')
  expect(response.status).toBe(200)
  expect(await response.text()).toBe('tests/utils/servers/dynamic/folder-based-routes/pets/[pet]/index.ts')
})
