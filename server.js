import crypto from 'crypto'
const randomID = () => crypto.randomBytes(8).toString('hex')

import { sessionStore } from './src/scripts/sessionStore.js'

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const http = createServer(app)
const io = new Server(http)

app.use(express.static(__dirname + '/dist'))

app.get('*', (_req, res) => {
    res.sendFile(__dirname + '/dist/index.html')
})

io.use(async (socket, next) => {
    let { privateID } = socket.handshake.auth

    if (privateID) {
        const session = await sessionStore.findSession(privateID)

        if (session) {
            // WARN: DRY senses tingling, idk how to fix (1/2)
            socket.privateID = privateID
            socket.session = session
            return next()
        } else {
            // TODO: sorry we can't seem to find that user 😬
        }
    }

    privateID = randomID()

    const session = {
        publicID: randomID(),
        username: 'anonymous'
    }

    sessionStore.saveSession(privateID, session)

    // WARN: DRY senses tingling, idk how to fix (2/2)
    socket.privateID = privateID
    socket.session = session

    next()
})

io.on('connection', async socket => {
    socket.onAny((event, ...args) => {
        console.log('server event:', event, args)
    })

    // NOTE: does this need to be split into two ? kind of does the same
    //       thing: initting ...
    socket.emit(
        'sessions',
        (await sessionStore.findAllSessions()).filter(
            ({ publicID }) => publicID !== socket.session.publicID
        )
    )
    socket.emit('session', {
        privateID: socket.privateID,
        ...socket.session
    })

    socket.join(socket.session.publicID)

    socket.broadcast.emit('user connected', socket.session)

    // socket.on('challenge', id => {
    //     // private message to `id`
    //     socket.to(id).emit('challenge', socket.id)
    // })

    // socket.on('challenge accept', id => {
    //     // private message to `id`
    //     socket.to(id).emit('challenge accept', socket.id)
    // })

    socket.on('kick', async id => {
        await sessionStore.forget(id)
        // WARN: we should be handling some of this logic
        //       on the kick sender's side ?
        io.in(id).emit('die')
        io.emit('ded', id)
    })

    socket.on('chat message', message => {
        socket.broadcast.emit('chat message', message)
    })

    socket.on('nuke', async () => {
        await sessionStore.destroy()

        socket.broadcast.emit('die')
    })

    socket.on('visible', visible => {
        socket.session.visible = visible
        sessionStore.saveSession(socket.privateID, socket.session)

        socket.broadcast.emit('visible', {
            visible,
            id: socket.session.publicID
        })
    })

    socket.on('typing', typing => {
        socket.broadcast.emit('typing', {
            id: socket.session.publicID,
            typing
        })
    })

    socket.on('username', username => {
        socket.session.username = username

        sessionStore.saveSession(socket.privateID, socket.session)

        socket.broadcast.emit('username', {
            username,
            id: socket.session.publicID
        })
    })

    // socket.on('disconnect', _reason => {
    //     delete sockets[socket.id]
    //     socket.broadcast.emit('disconnection', socket.id)
    // })
})

http.listen(process.env.PORT || 3000)
