// NOTE: default to in-memory database if we're not in production
let database = (() => {
    const database = {}
    // NOTE: not serializing, but we could if we wanted
    return {
        get: key => Promise.resolve(key in database ? database[key] : null),
        set: (key, value) => (database[key] = value)
    }
})()

if (process.env.NODE_ENV === 'production') {
    const Database = require('@replit/database')
    database = new Database()
}

const { v4: uuidv4 } = require('uuid')

const express = require('express')

const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

app.use(express.static(__dirname + '/'))

app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

io.use(async (socket, next) => {
    const { privateID } = socket.handshake.auth

    if (privateID) {
        const session = await database.get(privateID)

        if (session) {
            socket.session = session
            return next()
        } else {
            // TODO: sorry we can't seem to find that user 😬
        }
    }

    const session = {
        privateID: uuidv4(),
        publicID: uuidv4(),
        username: 'anonymous'
    }

    database.set(session.privateID, session)

    socket.session = session

    next()
})

io.on('connection', socket => {
    socket.onAny((event, ...args) => {
        console.log('server event:', event, args)
    })

    socket.emit(
        'sockets',
        [...io.of('/').sockets]
            .map(([_id, socket]) => socket)
            .filter(
                ({ session: { publicID } }) =>
                    publicID !== socket.session.publicID
            )
            .map(({ session: { publicID: id, username } }) => ({
                id,
                username
            }))
    )

    socket.emit('session', socket.session)

    socket.join(socket.session.publicID)

    socket.broadcast.emit('user connected', {
        id: socket.session.publicID,
        username: socket.session.username
    })

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

    socket.on('visibility', visible => {
        socket.broadcast.emit('visibility', {
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

    socket.on('update nickname', nickname => {
        socket.session.username = nickname
        database.set(socket.session.privateID, {
            privateID: socket.session.privateID,
            publicID: socket.session.publicID,
            username: nickname
        })
        socket.broadcast.emit('update nickname', {
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
