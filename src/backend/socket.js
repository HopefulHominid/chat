import { sessionStore } from './sessionStore.js'
import { Server } from 'socket.io'
import crypto from 'crypto'

const setupListeners = (socket, io) => {
    const listeners = {
        kick: async id => {
            await sessionStore.forget(id)
            // WARN: we should be handling some of this logic
            //       on the kick sender's side ?
            io.in(id).emit('die')
            io.emit('ded', id)
        },
        'chat message': message => {
            socket.broadcast.emit('chat message', message)
        },
        visible: visible => {
            socket.session.visible = visible
            sessionStore.saveSession(socket.privateID, socket.session)

            socket.broadcast.emit('visible', {
                visible,
                id: socket.session.publicID
            })
        },
        typing: typing => {
            socket.broadcast.emit('typing', {
                id: socket.session.publicID,
                typing
            })
        },
        username: username => {
            socket.session.username = username

            sessionStore.saveSession(socket.privateID, socket.session)

            socket.broadcast.emit('username', {
                username,
                id: socket.session.publicID
            })
        }
    }

    for (const [event, handler] of Object.entries(listeners)) {
        socket.on(event, handler)
    }
}

const onConnection = async (socket, io) => {
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

    setupListeners(socket, io)
}

const randomID = () => crypto.randomBytes(8).toString('hex')

const setupSession = async (socket, next) => {
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
}

export default function setupSocketIO(http) {
    const io = new Server(http)

    io.use(setupSession)

    io.on('connection', socket => onConnection(socket, io))
}
