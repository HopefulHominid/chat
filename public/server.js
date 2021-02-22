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
        io.emit('connection', `${nickname} joined`)
    })

    socket.on('chat message', message => {
        io.emit('chat message', `${sockets[socket.id]}: ${message}`)
    })

    socket.on('update nickname', nickname => {
        sockets[socket.id] = nickname
    })

    socket.on('disconnect', _reason => {
        // NOTE: disconnect is reserved
        io.emit('disconnection', `${sockets[socket.id]} left`)
        delete sockets[socket.id]
    })
})

http.listen(8080, () => {
    console.log('listening on localhost:8080')
})
