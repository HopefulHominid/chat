import { sessionStore } from './sessionStore.js'
import { Server } from 'socket.io'
import crypto from 'crypto'

const saveSession = async ({ privateID, session }) => {
    sessionStore.saveSession(privateID, session)
    console.log(JSON.stringify(session, null, 2))
}

const makePropertyListener = (socket, prop) => {
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
    // WARN: do we rly need to save visible to the database ? I think not
    //       we should have some kind of last seen stamp instead
    const propertyListeners = Object.fromEntries(
        ['visible', 'username'].map(prop => [
            prop,
            makePropertyListener(socket, prop)
        ])
    )

    const customListeners = {
        kick: async id => {
            await sessionStore.forget(id)
            // WARN: we should be handling some of this logic
            //       on the kick sender's side ?
            // WARN: shouldn't we be using .to here ? so we don't need
            //       rooms... see the cheat sheet and think more about this
            io.in(id).emit('kill yourself')
            socket.broadcast.emit('user disconnected', id)
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
            // WARN: big problem here. connected = false saved to database,
            //       but when we read it back on reconnection, we manually
            //       override w/ connected = true w/o saving. currently
            //       relying on the visibility update triggered by client
            //       on initial load to trigger save, thus fixing the
            //       connection state as well. very bad code. pretty sure
            //       we don't even need to store connected and visible
            //       in the database anyway, just a lazy artifact of me
            //       wanting to get something working earlier.
            // TODO: also, pretty sure, we don't even need to track connected
            //       at all... still not rly sure that we need both connected
            //       and visible given 1. we don't show connected only visible
            //       and 2. we use events only to communicate con and discon...
            //       FIX THIS!
            socket.session.connected = false
            saveSession(socket)

            socket.broadcast.emit('user disconnected', socket.session.publicID)
        },
        move: move => {
            socket.broadcast.emit('move', {
                id: socket.session.publicID,
                move
            })
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
        session: socket.session
    })

    // TODO: we only use this bc of some quirk (? or is it normal ?)
    //       in the kick handler... figure this out
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
                // whatever the stored connection was, override with true
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
