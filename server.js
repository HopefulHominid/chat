import express from 'express'
import { createServer } from 'http'
import { dirname } from 'path'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import { onConnection, setupSession } from './src/backend/starter.js'

// pretty sure this was introduced by moving from CommonJS to ES6 imports
// but some SO answer I forgot to link
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const http = createServer(app)
const io = new Server(http)

app.use(express.static(__dirname + '/dist'))

app.get('*', (_req, res) => {
    res.sendFile(__dirname + '/dist/index.html')
})

io.use(setupSession)

io.on('connection', socket => onConnection(socket, io))

http.listen(process.env.PORT || 3000)
