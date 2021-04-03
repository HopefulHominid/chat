<script>
    import { io } from 'socket.io-client'
    import { setContext, onMount } from 'svelte'
    import SessionList from './components/SessionList.svelte'
    import UsernameInput from './components/UsernameInput.svelte'
    import Chat from './components/Chat.svelte'

    // import Game from './Game.svelte'
    // const rps = ['🤚', '🤜', '✌️']

    // stores might solve this
    const uglyUpdate = () => (allSessions = allSessions)

    setContext('global', {
        getSocket: () => socket,
        getSession: () => session,
        uglyUpdate
    })

    const socket = io({ autoConnect: false })
    socket.auth = { privateID: localStorage.getItem('privateID') }
    socket.connect()
    socket.onAny((event, ...args) => {
        console.log('client event:', event, args)
    })

    // why does session in particular default to an obj ?
    let session = {}
    let sessions = {}
    $: allSessions = [
        session,
        ...Object.entries(sessions).map(([publicID, session]) => ({
            publicID,
            ...session
        }))
    ]

    let unread = false
    $: if (session.visible) unread = false
    $: faviconType = unread ? 'message' : 'resting'
    socket.on('chat message', () => {
        if (!session.visible) unread = true
    })

    const updateVisible = () => {
        const visible = document.visibilityState === 'visible'
        socket.emit('visible', visible)
        session.visible = visible
    }
    document.addEventListener('visibilitychange', updateVisible)

    const saveSession = ({ publicID, ...session }) =>
        (sessions[publicID] = session)

    socket.on('session', ({ privateID, ...hackSession }) => {
        socket.auth = { privateID }

        localStorage.setItem('privateID', privateID)

        session = hackSession

        updateVisible()
    })

    socket.on('sessions', sessions => sessions.forEach(saveSession))

    socket.on('user connected', newSession => {
        if (newSession.publicID === session.publicID) {
            console.log('o wow, we connected from somewhere else')
        } else {
            saveSession(newSession)
        }
    })

    socket.on('ded', id => {
        delete sessions[id]
        uglyUpdate()
    })

    socket.on('die', () => {
        socket.close()
        location.reload()
    })

    // prettier barrier
    ;['visible', 'username', 'typing'].forEach(event =>
        socket.on(
            event,
            session => (sessions[session.id][event] = session[event])
        )
    )
</script>

<svelte:head>
    <link rel="icon" href="/{faviconType}.ico" />
</svelte:head>

<main>
    <Chat />
    <UsernameInput username={session.username} />
    <SessionList list={allSessions} />
</main>

<style lang="scss">
    @use './style/global.scss';
    @use './style/mixins.scss' as *;

    main {
        width: 100%;
        font-size: 30px;

        // text-align: center;
    }
</style>
