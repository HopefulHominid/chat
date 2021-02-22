const express = require('express')

const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

app.use(express.static(__dirname + '/'))

app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

io.on('connection', socket => {
    io.emit('connection', 'someone connected')
    socket.on('chat message', msg => {
        io.emit('chat message', msg)
    })
    socket.on('disconnect', () => {
        io.emit('disconnection', 'someone left')
    })
})

http.listen(8080, () => {
    console.log('listening on localhost:8080')
})
