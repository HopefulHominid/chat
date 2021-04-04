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
        getSession: () => selfSession,
        uglyUpdate
    })

    const socket = io({ autoConnect: false })
    socket.auth = { privateID: localStorage.getItem('privateID') }
    socket.connect()
    socket.onAny((event, ...args) => {
        console.log('client event:', event, args)
    })

    // why does session in particular default to an obj ?
    let selfSession = {}
    let sessions = {}
    $: allSessions = [
        selfSession,
        ...Object.entries(sessions).map(([publicID, session]) => ({
            publicID,
            ...session
        }))
    ].filter(({ connected }) => connected)

    let unread = false
    $: if (selfSession.visible) unread = false
    $: faviconType = unread ? 'message' : 'resting'
    socket.on('chat message', () => {
        if (!selfSession.visible) unread = true
    })

    const updateVisible = () => {
        const visible = document.visibilityState === 'visible'
        socket.emit('visible', visible)
        selfSession.visible = visible
    }
    document.addEventListener('visibilitychange', updateVisible)

    const saveSession = ({ publicID, ...session }) =>
        (sessions[publicID] = session)

    socket.on('init', ({ privateID, sessions, ...session }) => {
        socket.auth = { privateID }
        localStorage.setItem('privateID', privateID)
        selfSession = session
        sessions.forEach(saveSession)
        updateVisible()
    })

    socket.on('user connected', session => {
        // make sure we're not connecting from elsewhere
        if (session.publicID !== selfSession.publicID) saveSession(session)
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
    <UsernameInput username={selfSession.username} />
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
