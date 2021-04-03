import express from 'express'
import { createServer } from 'http'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import setupSocketIO from './src/backend/socket.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const http = createServer(app)
setupSocketIO(http)

app.use(express.static(__dirname + '/dist'))

app.get('*', (_req, res) => {
    res.sendFile(__dirname + '/dist/index.html')
})

http.listen(process.env.PORT || 3000)
