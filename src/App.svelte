<script>
    import { io } from 'socket.io-client'
    import { setContext, tick } from 'svelte'
    import { style } from './scripts/utils.js'
    import {
        centerChat,
        textColor,
        hideOfflineUsers
    } from './scripts/settings.js'
    import SessionList from './components/SessionList.svelte'
    import UsernameInput from './components/UsernameInput.svelte'
    import Chat from './components/Chat.svelte'
    import Game from './components/Game.svelte'
    import Settings from './components/Settings.svelte'

    // TODO: stores might solve this
    const uglyUpdate = () => (sessions = sessions)

    // TODO: this feels kinda hairy, setting this context and importing it
    //       everywhere in all our subcomponents... think more about this
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

    // NOTE: first real bug noticed w/ let vs const! wow! see the rest
    //       of this commit for details. basically we were dishing out
    //       selfSession in context, expecting to be able to keep obj
    //       reference, but our init function was reassigning the obj!
    //       so we fixed using const and Object.assign! cool!
    // TODO: still not really sure why we make this distinction of self
    //       I guess we need SOME variable to track ourself (do we ?) so
    //       might as well be this... or some kind of ID ?
    const selfSession = {}
    const otherSessions = {}
    // WARN: a hairy little factory... needed to combine weirdly structured
    //       data... find a way to store more consistently ?
    // TODO: check on how much this is updating.... make sure svelte updates
    //       aren't going haywire in the background
    $: sessions = [
        selfSession,
        ...Object.entries(otherSessions)
            .map(([publicID, session]) => ({
                publicID,
                ...session
            }))
            .filter(({ connected }) => !$hideOfflineUsers || connected)
            .sort((a, b) => Boolean(b.connected) - Boolean(a.connected))
    ]

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
        (otherSessions[publicID] = session)

    // TODO: svelte question: do we need this default ? what about in Chat ?
    let messages = []

    socket.on(
        'init',
        async ({ privateID, otherSessions, session, messages: mail }) => {
            // TODO: kinda redundant... maybe. leave comment justifying later
            //       y do we do this. check the tut maybe
            //       // attach the session ID to the next reconnection attempts
            //       was his comment.... ponder this for a while
            socket.auth = { privateID }
            localStorage.setItem('privateID', privateID)

            Object.assign(selfSession, { ...session, connected: true })
            otherSessions.forEach(saveSession)

            // NOTE: need this bc visibilitychange doesn't fire on initial page load
            //       and we don't know if the tab is visible or hidden (e.g.,
            //       opened via pinned tab in background or Ctrl click link)
            updateVisible()

            messages = mail
            await tick()
            window.scrollTo(0, document.body.scrollHeight)
        }
    )

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
        otherSessions[id].connected = false
    })

    socket.on('kill yourself', () => {
        socket.close()
        location.reload()
    })

    // prettier barrier - the cost of no semicolons
    ;['visible', 'username', 'typing'].forEach(event =>
        socket.on(event, ({ id, [event]: value }) => {
            const target =
                id === selfSession.publicID ? selfSession : otherSessions[id]
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
    <Chat {messages} />
    <UsernameInput username={selfSession.username} />
    <SessionList {sessions} />
    <Settings />
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
