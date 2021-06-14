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
        // NOTE: we keep this for a *slight* speed improvement. consider the
        //       cases. 1. going from chat tab to non-chat tab. in this case we
        //       correctly set visible=false faster than the server can send its
        //       visible=false||false||...||false response back. 2. going from
        //       chat tab to chat tab. in this case the 1st tab sets visible=false
        //       faster than usual, which is fine (?) because there is a moment
        //       when the program is in-between tabs where no one tab is visible,
        //       and the server will send back visible=false||...||false for just
        //       a moment which is intended behavior anyway (as it doesn't know that
        //       we're about to land on our own tab yet. then we do land our own
        //       tab, and this line sets visible=true faster than the server can
        //       send back visible=(false||false||false||true)=true. 3. going from
        //       non-chat to chat is similar case, where this makes our visible=true
        //       update slightly faster correctly (the non-visible tabs still have
        //       to wait to get their visible=true update from the server, but this
        //       is completely fine as idk if there's ever a case where the user even
        //       is able to see visibilitystate=hidden tabs in the first place. so
        //       overall this line doesn't change the intended behavior and offers
        //       a slight speed boost.
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

    // socket.on('username', session => {
    //     if (session.id !== selfSession.publicID) {
    //         sessions[session.id]['username'] = session['username']
    //     }
    // })

    // prettier barrier - the cost of no semicolons
    ;['visible', 'username', 'typing'].forEach(event =>
        socket.on(event, ({ id, [event]: value }) => {
            const target =
                id === selfSession.publicID ? selfSession : sessions[id]
            target[event] = value
            // NOTE: need this bc of svelty sveltyness
            uglyUpdate()
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
