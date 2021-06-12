import { sessionStore } from './sessionStore.js'
import { Server } from 'socket.io'
import crypto from 'crypto'

// WARN: kinda weird signature... maybe just make it two-place for better
//       readability
// TODO: yeah, do this
const saveSocket = async ({ privateID, session }) => {
    sessionStore.saveSession(privateID, session)
}

const setupListeners = (socket, io) => {
    const propertyListeners = {
        visible: async value => {
            socket.session.visible = value

            // NOTE: I wish there was an easier way to ask socket.io: "yo give
            //       me all the sockets in this room." but this is the best i
            //       came up with for now
            let visible = false
            const socketsInSession = await io
                .in(socket.session.publicID)
                .allSockets()
            for (const socketID of socketsInSession) {
                // NOTE: again, this line feels so hairy to me. why socket.io why ?
                const socket = io.sockets.sockets.get(socketID)
                if (socket.session.visible) {
                    visible = true
                    break
                }
            }

            // NOTE: this broadcasts messages to our own session's sockets. I
            //       don't know an elegant way to avoid this. see comment on
            //       client side visible event handler as well
            socket.broadcast.emit('visible', {
                visible,
                id: socket.session.publicID
            })
        },
        username: value => {
            socket.session.username = value
            // TODO: make this so it doesn't store visible in database anymore!
            //       we don't need to do this! (i think... review rest of code)
            saveSocket(socket)

            // TODO: this emits visible change to our own session's sockets...
            //       not right
            socket.broadcast.emit('username', {
                username: value,
                id: socket.session.publicID
            })
        }
    }

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
        disconnect: async _reason => {
            // NOTE: why not use io.in(blah).sockets ? different signature, not
            //       async... why are there two !!??! maybe ping developer ?
            //       he uses this in part 2 of the tut, but why ?
            const matchingSockets = await io
                .in(socket.session.publicID)
                .allSockets()
            const isDisconnected = matchingSockets.size === 0
            if (isDisconnected) {
                socket.broadcast.emit(
                    'user disconnected',
                    socket.session.publicID
                )
            }
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
        sessions: (await sessionStore.findAllSessions())
            .filter(({ publicID }) => publicID !== socket.session.publicID)
            .map(session => ({
                ...session,
                // NOTE: this is why we don't have to store connected in db.
                //       we can just ask socket: "is this person here rn ?"
                // NOTE: list all rooms, then check if there is a room w/ our id
                connected: io.sockets.adapter.rooms.has(session.publicID)
            })),
        session: socket.session
    })

    // TODO: we only use this bc of some quirk (? or is it normal ?)
    //       in the kick handler... figure this out
    //       also helps manage multi-tab single users right ?
    socket.join(socket.session.publicID)

    // TODO: maybe we only want to broadcast this if it's a new user...
    //       otherwise we're overwriting the session we already have
    //       race condition here w/ visible update triggered by 'init' ?
    socket.broadcast.emit('user connected', socket.session)

    setupListeners(socket, io)
}

// WARN: we're not doing anything to prevent collisions in Firebase collection...
//        what would happen on a collision ? probably disaster....
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
            // TODO: next() vs return next() ? look at express to make 100% sure
            //       this is kosher
            return next()
        } else {
            // TODO: sorry we can't seem to find that user 😬
        }
    }

    privateID = randomID()

    const session = {
        publicID: randomID(),
        // anony🐭 ?
        username: 'anonymous',
        connected: true
    }

    // WARN: DRY senses tingling, idk how to fix (2/2)
    // WARN: might be bad practice to be adding all these things to the socket...
    //       a lot of collision opportunities... how else to do it ? global var
    //       in this file maybe ? guy said you could "You can attach any attribute"
    //       in part 1 of the tut, but x to doubt that it's good practice
    // WARN: yeah this feels like a rly bad idea there's like 1e6 props on socket
    // NOTE: but the benefit of this is that these properties are visible when we do
    //       io.of("/").sockets ... hmmm ....
    // WARN: also idk about the philosophical decision to not store privateID as part
    //       of the session, but some extra, floating value. kind of confusing. e.g.,
    //       findAllSessions doesn't return the privateID for anyone... is that wut
    //       we want ?
    socket.privateID = privateID
    socket.session = session

    saveSocket(socket)

    next()
}

export default function setupSocketIO(http) {
    const io = new Server(http)

    io.use(setupSession)

    io.on('connection', socket => onConnection(socket, io))
}
