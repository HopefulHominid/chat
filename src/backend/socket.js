import { sessionStore } from './sessionStore.js'
import { Server } from 'socket.io'
import crypto from 'crypto'

const saveSession = async ({ privateID, session }) =>
    sessionStore.saveSession(privateID, session)

const makePropertyUpdater = (socket, prop) => {
    return value => {
        socket.session[prop] = value
        saveSession(socket)

        socket.broadcast.emit(prop, {
            [prop]: value,
            id: socket.session.publicID
        })
    }
}

const setupListeners = (socket, io) => {
    const propertyListeners = Object.fromEntries(
        ['visible', 'username'].map(prop => [
            prop,
            makePropertyUpdater(socket, prop)
        ])
    )

    const customListeners = {
        kick: async id => {
            await sessionStore.forget(id)
            // WARN: we should be handling some of this logic
            //       on the kick sender's side ?
            io.in(id).emit('kill yourself')
            socket.broadcast.emit('forget session', id)
        },
        'chat message': message => {
            socket.broadcast.emit('chat message', message)
        },
        typing: typing => {
            socket.broadcast.emit('typing', {
                id: socket.session.publicID,
                typing
            })
        },
        disconnect: _reason => {
            socket.session.connected = false
            saveSession(socket)
            socket.broadcast.emit('forget session', socket.session.publicID)
        }
    }

    const listeners = { ...customListeners, ...propertyListeners }

    for (const [event, handler] of Object.entries(listeners)) {
        socket.on(event, handler)
    }
}

const onConnection = async (socket, io) => {
    socket.onAny((event, ...args) => {
        console.log('server event:', event, args)
    })

    socket.emit('init', {
        privateID: socket.privateID,
        sessions: (await sessionStore.findAllSessions()).filter(
            ({ publicID }) => publicID !== socket.session.publicID
        ),
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
            socket.session = {
                ...session,
                connected: true
            }
            return next()
        } else {
            // TODO: sorry we can't seem to find that user 😬
        }
    }

    privateID = randomID()

    const session = {
        publicID: randomID(),
        username: 'anonymous',
        connected: true
    }

    // WARN: DRY senses tingling, idk how to fix (2/2)
    socket.privateID = privateID
    socket.session = session

    saveSession(socket)

    next()
}

export default function setupSocketIO(http) {
    const io = new Server(http)

    io.use(setupSession)

    io.on('connection', socket => onConnection(socket, io))
}
