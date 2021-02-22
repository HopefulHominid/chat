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
        sockets[socket.id] = nickname
        socket.broadcast.emit('connection', `${nickname} joined`)
    })

    socket.on('chat message', message => {
        socket.broadcast.emit('chat message', `${sockets[socket.id]}: ${message}`)
    })

    socket.on('update nickname', nickname => {
        socket.broadcast.emit(
            'update nickname',
            `${sockets[socket.id]} changed their name to ${nickname}`
        )
        sockets[socket.id] = nickname
    })

    socket.on('disconnect', _reason => {
        // NOTE: disconnect is reserved
        // NOTE: is there a diff btw `socket.broadcast` and `io` here ?
        socket.broadcast.emit('disconnection', `${sockets[socket.id]} left`)
        delete sockets[socket.id]
    })
})

http.listen(8080, () => {
    console.log('listening on localhost:8080')
})
