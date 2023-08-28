import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({
  port: 4001
})

wss.on('connection', (ws, request, client) => {
  ws.on('error', console.error)

  ws.on('message', (data) => {
    ws.send(data)
  })
})
