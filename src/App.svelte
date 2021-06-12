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
        socket.emit('visible', visible)
        selfSession.visible = visible
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

        selfSession = session
        sessions.forEach(saveSession)

        // NOTE: need this bc visibilitychange doesn't fire on initial page load
        //       and we don't know if the tab is visible or hidden (e.g.,
        //       opened via pinned tab in background or Ctrl click link)
        updateVisible()
    })

    socket.on('user connected', session => {
        // NOTE: we could also just update .connected if we already have them...
        //       don't think it matter tho ... ?
        //       yeah it's redundant to send connected: true over the network,
        //       this very event firing indicates that it must be true... but
        //       who cares ? ... i care...
        // make sure we're not connecting from elsewhere
        if (session.publicID !== selfSession.publicID) saveSession(session)
        console.log('overwrote session!')
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

    socket.on('visible', session => {
        // NOTE: we want to ignore visible changes that are broadcast from our
        //       own additional tabs
        // NOTE: another solution would be to somehow avoid broadcasting to our
        //       own sockets... not sure how to do this ? would have to manually
        //       loop over sockets and emit individually ? or create a room called
        //       not-session-X for each session and have everyone else join that
        //       kind of yucky, we'll go with this for now but I don't love
        //       broadcasting messages I know we're going to ignore
        if (session.id !== selfSession.publicID) {
            sessions[session.id]['visible'] = session['visible']
        }
    })

    // prettier barrier - the cost of no semicolons
    ;['username', 'typing'].forEach(event =>
        socket.on(event, session => {
            sessions[session.id][event] = session[event]
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
