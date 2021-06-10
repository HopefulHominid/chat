<script>
    import { io } from 'socket.io-client'
    import { setContext } from 'svelte'
    import { style } from './scripts/utils.js'
    import { centerChat, textColor } from './scripts/settings.js'
    import SessionList from './components/SessionList.svelte'
    import UsernameInput from './components/UsernameInput.svelte'
    import Chat from './components/Chat.svelte'
    import Game from './components/Game.svelte'
    import Settings from './components/Settings.svelte'

    // TODO: stores might solve this
    const uglyUpdate = () => (allConnectedSessions = allConnectedSessions)

    setContext('global', {
        getSocket: () => socket,
        getSession: () => selfSession,
        uglyUpdate
    })

    // autoConnect false to give us a chance to setup auth object ...
    const socket = io({ autoConnect: false })
    socket.auth = { privateID: localStorage.getItem('privateID') }
    // ... then manually connect afterwards
    socket.connect()

    socket.onAny((event, ...args) => {
        console.log('client event:', event, args)
    })

    // why does session in particular default to an obj ?
    // TODO: is the above comment relevant anymore ?
    let selfSession = {}
    let sessions = {}
    $: allConnectedSessions = [
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

    socket.on('init', ({ privateID, sessions, session }) => {
        // TODO: kinda redundant... maybe. leave comment justifying later
        socket.auth = { privateID }
        localStorage.setItem('privateID', privateID)

        for (const prop in session) {
            console.log(prop)
        }
        console.log(session)

        selfSession = session
        sessions.forEach(saveSession)
        
        // NOTE: need this bc sometimes we miss the initial
        //       visibilitychange event... (or maybe no event fires) 
        //       don't know under exactly what conditions this happens...
        //       learn more
        updateVisible()
    })

    socket.on('user connected', session => {
        // make sure we're not connecting from elsewhere
        if (session.publicID !== selfSession.publicID) saveSession(session)
    })

    socket.on('user disconnected', id => {
        delete sessions[id]
        uglyUpdate()
    })

    socket.on('kill yourself', () => {
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

<main
    use:style={{
        '--text-align': $centerChat ? 'center' : 'initial',
        '--color': $textColor
    }}
>
    <Settings />
    <Chat />
    <UsernameInput username={selfSession.username} />
    <SessionList list={allConnectedSessions} />
    <!-- <Game /> -->
</main>

<style lang="scss">
    @use './style/global.scss';
    @use './style/mixins.scss' as *;

    main {
        width: 100%;
        font-size: 30px;

        color: var(--color);
        text-align: var(--text-align);
    }
</style>
