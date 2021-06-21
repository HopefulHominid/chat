import { sessionStore, messageStore } from './sessionStore.js'
import { Server } from 'socket.io'
import cuid from 'cuid'

// NOTE: now we have to remember to await this bc it uses an async method! GROSS!
const isSessionVisible = async (id, io) => {
    // NOTE: I wish there was an easier way to ask socket.io: "yo give
    //       me all the sockets in this room." but this is the best i
    //       came up with for now
    // TODO: maybe could extract to .getRoomSockets or some such...
    const socketsInSession = await io.in(id).allSockets()
    for (const socketID of socketsInSession) {
        // NOTE: again, this line feels so hairy to me. why socket.io why ?
        //       but this is the official way. probably bc in the tut
        //       io.of('/').sockets appeared less hairy, given .sockets is
        //       alias for .of('/')
        const socket = io.sockets.sockets.get(socketID)
        if (socket.session.visible) return true
    }
    return false
}

const setupListeners = (socket, io) => {
    const listeners = {
        // TODO: this probably doesn't even work anymore... figure out how we
        //       would integrate w/ firebase then fix
        kick: async publicID => {
            await sessionStore.forgetUser(publicID)
            // WARN: we should be handling some of this logic
            //       on the kick sender's side ?
            // WARN: shouldn't we be using .to here ? so we don't need
            //       rooms... see the cheat sheet and think more about this
            io.in(publicID).emit('kick yourself')
            io.emit('user kicked', publicID)
        },
        'chat message': async message => {
            await messageStore.saveMessage(message)
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
            const socketsInSession = await io
                .in(socket.session.publicID)
                .allSockets()
            if (socketsInSession.size === 0) {
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
        },
        // TODO: there's the possibility that we
        //       tell everyone over and over again that we're visible, bc
        //       we keep opening new tabs in the background... what's the
        //       answer here ? not too big a problem for now but bruh. i h8
        //       unnecessary event emissions
        // TODO: yeah fix this
        visible: async value => {
            // NOTE: we save visible to the session here only so that we can
            //       check all of a session's sockets for visibility
            //       in the isSessionVisible function ... is this the best way ?
            socket.session.visible = value

            socket.broadcast.emit('visible', {
                // NOTE: if value === true, we don't even need to do this check
                visible:
                    value ||
                    (await isSessionVisible(socket.session.publicID, io)),
                id: socket.session.publicID
            })
        },
        username: async value => {
            await sessionStore.saveSession(socket.privateID, {
                username: value
            })

            socket.broadcast.emit('username', {
                username: value,
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

    // NOTE: single room where we can see every socket that belongs to this session
    socket.join(socket.session.publicID)

    // WARN: kinda don't like passing around context like this...
    //       better architecture ?
    setupListeners(socket, io)

    // WARN: we fire this before init, hoping that all the other sessions receive
    //       the update and store this user in their sessions store BEFORE
    //       we emit init. bc we expect init to trigger visibility update. if this
    //       fails for some reason and the user is not stored in the sessions db,
    //       then the visibility update will try to store the visible value on a
    //       non-existent user and it will error. not sure what to do about this
    //       case. maybe make it so client visible receiver doesn't error if
    //       u can't find it sessions but rather silently ignores. or stores
    //       visible and tries a few more times before ignoring. or all clients have
    //       to send back msg confirming they got the new user before we let them
    //       have visible. for now, just hoping that this isn't a big problem
    // TODO: emit w/ acknowledgement on client side ??? look into this!!!
    // NOTE: avoid sending unnecessary visible prop... we should be handling this
    //       elsewhere, and sending more data than we need here can hide bugs
    // TODO: this should never have visible in it anyway, so we probably don't need
    //       to do this... like that this code FORCES out visible if it is there...
    // NOTE: if statement logic ensures we only receive user connected event on
    //       client when a new session rly is connected
    const socketsInSession = await io.in(socket.session.publicID).allSockets()
    if (socketsInSession.size === 1) {
        socket.broadcast.emit('user connected', {
            publicID: socket.session.publicID,
            username: socket.session.username
        })
    }

    socket.emit('init', {
        privateID: socket.privateID,
        // TODO: this feels so disgusting...
        // NOTE: update on who has already joined the party
        otherSessions: await Promise.all(
            (
                await sessionStore.allSessions()
            )
                .filter(({ publicID }) => publicID !== socket.session.publicID)
                .map(async session => ({
                    ...session,
                    // NOTE: this is why we don't have to store connected in db.
                    //       we can just ask socket: "is this person here rn ?"
                    // NOTE: list all rooms, then check if there is a room w/ our id
                    connected: io.sockets.adapter.rooms.has(session.publicID),
                    // TODO: would it be faster / better to store these properties
                    //       somewhere ? looping through all the sockets every time
                    //       (and also in the visible handler, see comment above that)
                    //       seems kinda heavy
                    visible: await isSessionVisible(session.publicID, io)
                }))
        ),
        // TODO: this shouldn't have visible in it... make sure of that later
        session: socket.session,
        // TODO: not even sure we need to be sorting here, at least for the prod
        //       database (and we could modify our dev if prod turns out not to
        //       need it). assuage my fears future me
        messages: (await messageStore.allMessages()).sort(
            (a, b) => a.timestamp - b.timestamp
        )
    })
}

const setupSession = async (socket, next) => {
    let { privateID } = socket.handshake.auth

    if (privateID) {
        const session = await sessionStore.findSession(privateID)

        if (session) {
            // WARN: DRY senses tingling, idk how to fix (1/2)
            socket.privateID = privateID
            socket.session = session
            // TODO: next() vs return next() ? look at express to make 100% sure
            //       this is kosher
            return next()
        } else {
            // TODO: sorry we can't seem to find that user 😬
        }
    }

    // WARN: DRY senses tingling, idk how to fix (2/2)
    // WARN: might be bad practice to be adding all these things to the socket...
    //       a lot of collision opportunities... how else to do it ? global var
    //       in this file maybe ? guy said you could "You can attach any attribute"
    //       in part 1 of the tut, but x to doubt that it's good practice
    // WARN: yeah this feels like a rly bad idea there's like 1e6 props on socket
    // NOTE: but the benefit of this is that these properties are visible when we do
    //       io.of("/").sockets ... hmmm ....
    //       yea i think we need this in order to do our cross-socket visibility check
    // WARN: also idk about the philosophical decision to not store privateID as part
    //       of the session, but some extra, floating value. kind of confusing. e.g.,
    //       allSessions doesn't return the privateID for anyone... is that wut
    //       we want ?
    socket.privateID = cuid()
    socket.session = {
        publicID: cuid(),
        // anony🐭 ?
        username: 'anonymous'
    }
    // TODO: do we really need this ? I guess it couldn't hurt ...
    if (socket.privateID === socket.session.publicID) throw Error('COLLISION!')

    // TODO: there should be some code that makes SURE our supposedly non-colliding ids
    //       don't actually collide, which forces this function to start over if they do
    //       what's the point of fancy cuid library if I'm just checking ids anyway ?
    await sessionStore.saveSession(socket.privateID, socket.session)

    next()
}

export default function setupSocketIO(http) {
    const io = new Server(http)

    // TODO: why do we have this separate setup session middleware ?
    //       why not just do everything in one function ? why does
    //       the tut choose to do it like this ?
    //       something to do w/ separating out authentication ? y ?
    io.use(setupSession)

    io.on('connection', socket => onConnection(socket, io))
}
