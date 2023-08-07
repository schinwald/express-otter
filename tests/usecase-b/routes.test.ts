import { expect, test } from 'bun:test'
import express from 'express'
import { registerRouters } from '../..'

test('test routes for usecase-b', async () => {
  await new Promise(async (resolve) => {
    const app = express()

    await registerRouters({
      app,
      paths: ['./tests/usecase-b/routes/'],
      dynamic: false,
      beforeRegister: (path) => {
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
  expect(await response.text()).toBe('tests/usecase-b/routes/pets.ts')

  response = await fetch('http://localhost:3001/pets/dog')
  expect(response.status).toBe(200)
  expect(await response.text()).toBe('tests/usecase-b/routes/pets/[pet].ts')
})
