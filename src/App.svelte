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
    // WARN: a hairy little factory... needed to combine weirdly structured
    //       data... find a way to store more consistently ?
    // TODO: check on how much this is updating.... make sure svelte updates
    //       aren't going haywire in the background
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
        
        selfSession.visible = visible

        // NOTE: put this after so we can be sure selfSession gets updated first
        //       why you ask ? does it matter ? who knows ? im sick of thinking
        //       about obscure visibility bugs
        socket.emit('visible', visible)
    }
    document.addEventListener('visibilitychange', updateVisible)

    const saveSession = ({ publicID, ...session }) =>
        (sessions[publicID] = session)

    socket.on('init', ({ privateID, sessions, session }) => {
        // TODO: kinda redundant... maybe. leave comment justifying later
        //       y do we do this. check the tut maybe
        //       // attach the session ID to the next reconnection attempts
        //       was his comment.... ponder this for a while
        socket.auth = { privateID }
        localStorage.setItem('privateID', privateID)

        selfSession = { ...session, connected: true }
        sessions.forEach(saveSession)

        // NOTE: need this bc visibilitychange doesn't fire on initial page load
        //       and we don't know if the tab is visible or hidden (e.g.,
        //       opened via pinned tab in background or Ctrl click link)
        updateVisible()
    })

    // WARN: if this function mysteriously (e.g., wait()) takes 100 years to
    //       execute... possible that we miss the first visibility update
    //       don't rly have a good solution for this. some ideas tho. see
    //       comment above server's user connected emit
    socket.on('user connected', session => {
        // NOTE: make sure it's not our own session's socket that sent this
        if (session.publicID !== selfSession.publicID) {
            saveSession({
                ...session,
                connected: true
            })
        }
    })

    socket.on('user disconnected', id => {
        sessions[id].connected = false
        // TODO: do we need this anymore ?
        uglyUpdate()
    })

    socket.on('kill yourself', () => {
        socket.close()
        location.reload()
    })

    // prettier barrier - the cost of no semicolons
    ;['visible', 'username', 'typing'].forEach(event =>
        socket.on(event, ({ id, [event]: value }) => {
            const target =
                id === selfSession.publicID ? selfSession : sessions[id]
            // NOTE: ignore the visibility=false update that comes from going
            //       from one in-session-chat-tab to another while the browser
            //       is in a limbo in-between-tabs state, given we know based
            //       on selfSession.visible that we just landed on our own tab!
            if (
                !(
                    event === 'visible' &&
                    target === selfSession &&
                    selfSession.visible
                )
            ) {
                target[event] = value
                // NOTE: need this bc of svelty sveltyness
                uglyUpdate()
            }
        })
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
