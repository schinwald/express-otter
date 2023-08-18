import chai from 'chai'
import { fork, ChildProcess } from 'node:child_process'
import fetch from 'node-fetch'

const should = chai.should()
let child: ChildProcess

describe('test static file-based routes for commonjs', () => {
  before(async () => {
    child = fork('./index.js', [], {
      stdio: 'pipe',
      cwd: './examples/commonjs/static/file-based-routes'
    })

    should.not.equal(child.stdout, null)

    await new Promise((resolve, reject) => {
      if (child.stdout === null) {
        reject('stdout is null')
        return
      }

      child.stdout.on('data', (data) => {
        if (/Server running/.test(data.toString())) {
          resolve(data)
        }
      })
    })
  })

  after(() => {
    child.kill('SIGKILL')
  })

  it('should return the correct path for the /pets endpoint', async () => {
    const response = await fetch('http://localhost:4000/pets')
    should.equal(response.status, 200)
    should.equal(await response.text(), 'src/routes/pets.js')
  })

  it('should return the correct path for the /pets/dog endpoint', async () => {
    const response = await fetch('http://localhost:4000/pets/dog')
    should.equal(response.status, 200)
    should.equal(await response.text(), 'src/routes/pets/[pet].js')
  })
})