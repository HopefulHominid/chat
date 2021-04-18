import express from 'express'
import fetch, { FetchError } from 'node-fetch'
import { Handler } from 'htmlmetaparser'
import { Parser } from 'htmlparser2'
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

app.get('/og/*', (req, res, next) => {
    const url = decodeURIComponent(req.path.slice(4))

    fetch(url)
        .then(res => res.text())
        .then(html => {
            const handler = new Handler((_err, result) => res.send(result), {
                url
            })
            const parser = new Parser(handler, { decodeEntities: true })
            parser.write(html)
            parser.end()
        })
        .catch(e => {
            e instanceof FetchError ? res.send({}) : console.error(e)
        })
})

// send all random urls to the homepage
app.get('*', (_req, res) => {
    res.sendFile(__dirname + '/dist/index.html')
})

http.listen(process.env.PORT || 3000)
