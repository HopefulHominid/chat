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

// io.use(async (socket, next) => {
//     const { sessionID } = socket.handshake.auth

//     if (sessionID) {
//         const session = database.get(sessionID)

//         if (session) {
//             socket.sessionID = sessionID
//             socket.userID = session.userID
//             socket.username = session.username
//             return next()
//         } else {
//             // TODO: sorry we can't seem to find that user 😬
//             //       guess we'll create a new one ...
//         }
//     }

//     socket.sessionID = uuidv4()
//     socket.userID = uuidv4()
//     socket.username = 'anonymous'

//     // TODO: why not store it right after you create it ? why wait until discon

//     next()
// })

const sockets = {}

io.on('connection', socket => {
    sockets[socket.id] = {
        name: 'anonymous',
        typing: false,
        visible: true,
        from: [],
        to: []
    }

    // socket.cise = 'nice'
    // socket.emit('cise', 'wow')

    // socket.emit('session', {
    //     sessionID: socket.sessionID,
    //     userID: socket.userID,
    //     username: socket.username
    // })

    io.emit('sockets', sockets)

    socket.on('challenge', id => {
        // private message to `id`
        socket.to(id).emit('challenge', socket.id)
    })

    socket.on('challenge accept', id => {
        // private message to `id`
        socket.to(id).emit('challenge accept', socket.id)
    })

    socket.on('chat message', message => {
        const formatter = new Intl.DateTimeFormat('en', {
            dateStyle: 'long',
            timeStyle: 'medium',
            calendar: 'japanese'
        })

        socket.broadcast.emit('chat message', {
            timestamp: formatter.format(Date.now()),
            username: sockets[socket.id] ? sockets[socket.id].name : '???',
            user: socket.id,
            message
        })
    })

    socket.on('visibility', visible => {
        sockets[socket.id].visible = visible
        socket.broadcast.emit('visibility', {
            visible,
            id: socket.id
        })
    })

    socket.on('typing start', () => {
        io.emit('typing start', socket.id)
    })

    socket.on('typing stop', () => {
        io.emit('typing stop', socket.id)
    })

    socket.on('update nickname', nickname => {
        sockets[socket.id].name = nickname
        socket.broadcast.emit('update nickname', {
            id: socket.id,
            name: nickname
        })
    })

    socket.on('disconnect', _reason => {
        delete sockets[socket.id]
        socket.broadcast.emit('disconnection', socket.id)
    })
})

http.listen(process.env.PORT || 8080)
