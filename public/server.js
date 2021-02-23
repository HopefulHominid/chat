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
    socket.on('connection', nickname => {
        sockets[socket.id] = {
            name: nickname,
            typing: false
        }
        io.emit('sockets', sockets)
    })

    socket.on('chat message', message => {
        socket.broadcast.emit(
            'chat message',
            `${sockets[socket.id].name}: ${message}`
        )
    })

    socket.on('typing start', () => {
        io.emit('typing start', socket.id)
    })

    socket.on('typing stop', () => {
        io.emit('typing stop', socket.id)
    })

    socket.on('update nickname', nickname => {
        sockets[socket.id].name = nickname
        io.emit('sockets', sockets)
    })

    socket.on('disconnect', _reason => {
        // NOTE: disconnect is reserved
        // NOTE: is there a diff btw `socket.broadcast` and `io` here ?
        //       if we're disconnecting... idk man.
        delete sockets[socket.id]
        socket.broadcast.emit('sockets', sockets)
    })
})

http.listen(8080, () => {
    console.log('listening on localhost:8080')
})
