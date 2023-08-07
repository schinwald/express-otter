import { expect, test } from 'bun:test'
import express from 'express'
import { registerRouters } from '../..'

test('test routes for usecase-a', async () => {
  await new Promise(async (resolve) => {
    const app = express()

    await registerRouters({
      app,
      paths: ['./tests/usecase-a/routes/'],
      dynamic: false,
      beforeRegister: (path) => {
        console.log(path)
      }
    })

    app.listen(3000, async () => {
      resolve('done')
    })
  })

  let response

  response = await fetch('http://localhost:3000/pets')
  expect(response.status).toBe(200)
  expect(await response.text()).toBe('tests/usecase-a/routes/pets/index.ts')

  response = await fetch('http://localhost:3000/pets/dog')
  expect(response.status).toBe(200)
  expect(await response.text()).toBe('tests/usecase-a/routes/pets/[pet]/index.ts')
})
