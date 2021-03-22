const crypto = require('crypto')
const randomID = () => crypto.randomBytes(8).toString('hex')

const { sessionStore } = require('./sessionStore')

const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

app.use(express.static(__dirname + '/'))

app.get('*', (_req, res) => {
    res.sendFile(__dirname + '/index.html')
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

io.on('connection', socket => {
    socket.onAny((event, ...args) => {
        console.log('server event:', event, args)
    })

    socket.emit(
        'sessions',
        sessionStore
            .findAllSessions()
            .filter(({ publicID }) => publicID !== socket.session.publicID)
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

    socket.on('chat message', message => {
        socket.broadcast.emit('chat message', message)
    })

    socket.on('visible', visible => {
        socket.session.visible = visible

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

    socket.on('username', nickname => {
        socket.session.username = nickname

        sessionStore.saveSession(socket.session.privateID, socket.session)

        socket.broadcast.emit('username', {
            id: socket.session.publicID,
            username: nickname
        })
    })

    // socket.on('disconnect', _reason => {
    //     delete sockets[socket.id]
    //     socket.broadcast.emit('disconnection', socket.id)
    // })
})

http.listen(process.env.PORT || 8080)
