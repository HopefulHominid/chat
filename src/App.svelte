<script>
    import { io } from 'socket.io-client'
    import { setContext, tick } from 'svelte'
    import SessionList from './components/SessionList.svelte'
    import Chat from './components/Chat.svelte'

    // import Game from './Game.svelte'
    // const rps = ['🤚', '🤜', '✌️']

    setContext('key', {
        getSocket: () => socket,
        getSession: () => session
    })

    const socket = io({ autoConnect: false })
    socket.auth = { privateID: localStorage.getItem('privateID') }
    socket.connect()
    socket.onAny((event, ...args) => {
        console.log('client event:', event, args)
    })

    let session = {}
    let sessions = {}

    $: allSessions = [
        session,
        ...Object.entries(sessions).map(([publicID, session]) => ({
            publicID,
            ...session
        }))
    ]

    let nickname
    let visible

    $: if (visible) unread = false

    const saveSession = ({ publicID, ...session }) =>
        (sessions[publicID] = session)

    const die = () => {
        socket.close()
        location.reload()
    }

    // TODO: listen for connect and disconnect events to set some variable to true/false?
    const attachEvents = () => {
        socket.on('session', ({ privateID, ...hackSession }) => {
            // WARN: so weird that this code has to be in here.
            //       but if we don't put it in here there's some race
            //       condition where we lose the first update on refresh
            updateVisible()
            document.addEventListener('visibilitychange', updateVisible)

            socket.auth = { privateID }

            localStorage.setItem('privateID', privateID)

            session = hackSession

            nickname = session.username

            session.visible = true
        })

        socket.on('ded', id => {
            delete sessions[id]
            sessions = sessions
        })

        socket.on('sessions', sessions => sessions.forEach(saveSession))

        socket.on('user connected', newSession => {
            if (newSession.publicID === session.publicID) {
                console.log('o wow, we connected from somewhere else')
            } else {
                saveSession(newSession)
            }
        })
        // fuck you
        // prettier
        ;['visible', 'username', 'typing'].forEach(event =>
            socket.on(
                event,
                session => (sessions[session.id][event] = session[event])
            )
        )

        socket.on('chat message', msg => {
            if (!visible) unread = true

            // WARN
            // add_to_messages(msg)
        })

        socket.on('die', die)
    }

    attachEvents()

    const updateVisible = () => {
        const visibleNew = document.visibilityState === 'visible'
        socket.emit('visible', visibleNew)
        session.visible = visibleNew
        visible = visibleNew
    }

    const updateNickname = () => {
        if (nickname) {
            socket.emit('username', nickname)
            session.username = nickname
        }
    }

    let unread = false

    $: faviconType = unread ? 'message' : 'resting'

    const nicknameKeydown = ({ key }) => {
        if (key === 'Enter') updateNickname()
    }
</script>

<svelte:head>
    <link rel="icon" href="/{faviconType}.ico" />
</svelte:head>

<main>
    <Chat />
    <input
        autocomplete="off"
        bind:value={nickname}
        on:keydown={nicknameKeydown}
    />
    <button on:click={updateNickname}>Update Nickname</button>
    <SessionList list={allSessions} />
</main>

<style lang="scss">
    @use './style/global.scss';
    @use './style/mixins.scss' as *;

    main,
    input,
    button {
        font-size: 30px;
    }

    main {
        width: 100%;

        // text-align: center;
    }
</style>
