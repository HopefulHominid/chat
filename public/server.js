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
        visible: true
    }

    io.emit('sockets', sockets)

    socket.on('chat message', message => {
        socket.broadcast.emit(
            'chat message',
            `${sockets[socket.id]?.name}: ${message}`
        )
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
        // NOTE: disconnect is reserved
        // NOTE: is there a diff btw `socket.broadcast` and `io` here ?
        //       if we're disconnecting... idk man.
        delete sockets[socket.id]
        socket.broadcast.emit('sockets', sockets)
    })
})

http.listen(process.env.PORT || 8080)
