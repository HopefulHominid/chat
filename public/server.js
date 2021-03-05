const express = require('express')

const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

app.use(express.static(__dirname + '/'))

app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

const sockets = {}

io.on('connection', socket => {
    sockets[socket.id] = {
        name: 'anonymous',
        typing: false,
        visible: true,
        from: [],
        to: []
    }

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
