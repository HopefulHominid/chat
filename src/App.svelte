<script>
    import { io } from 'socket.io-client'
    import { setContext, tick } from 'svelte'
    import SessionList from './components/SessionList.svelte'

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

    let message = 'your message here'
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
        //
        //
        ;['visible', 'username', 'typing'].forEach(event =>
            socket.on(
                event,
                session => (sessions[session.id][event] = session[event])
            )
        )

        socket.on('chat message', msg => {
            if (!visible) unread = true
            add_to_messages(msg)
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

    const sendMessage = () => {
        if (message) {
            const formatter = new Intl.DateTimeFormat('en', {
                dateStyle: 'long',
                timeStyle: 'medium',
                calendar: 'japanese'
            })

            const richMessage = {
                timestamp: formatter.format(Date.now()),
                username: nickname,
                id: session.publicID,
                message
            }

            socket.emit('chat message', richMessage)
            add_to_messages(richMessage)
            typingStop()
            message = ''
        }
    }

    const updateNickname = () => {
        if (nickname) {
            socket.emit('username', nickname)
            session.username = nickname
        }
    }

    let unread = false

    $: faviconType = unread ? 'message' : 'resting'

    let typing = false
    // WARN: weird pattern
    $: session.typing = typing

    let delay = 2000
    let hook

    const typingStart = () => {
        !typing ? socket.emit('typing', (typing = true)) : clearTimeout(hook)
        hook = setTimeout(typingStop, delay)
    }

    const typingStop = () => {
        socket.emit('typing', (typing = false))
        clearTimeout(hook)
    }

    const messageKeydown = e => {
        // WARN: kinda complex behavior, maybe we should avoid
        if (e.key === 'Enter') {
            if (e.ctrlKey || e.altKey) {
                message += '\n'
            } else if (e.shiftKey) {
            } else {
                sendMessage()
                e.preventDefault()
            }
        }
    }

    const nicknameKeydown = ({ key }) => {
        if (key === 'Enter') updateNickname()
    }

    let messages = []

    const add_to_messages = async msg => {
        messages = [...messages, msg]
        await tick()
        window.scrollTo(0, document.body.scrollHeight)
    }
</script>

<svelte:head>
    <link rel="icon" href="/{faviconType}.ico" />
</svelte:head>

<main>
    <ul>
        {#each messages as { timestamp, username, message, id }, i}
            <li title={timestamp}>
                {messages[i - 1]?.id === id ? '' : `${username}:`}
                <pre>{message}</pre>
            </li>
        {/each}
    </ul>
    <textarea
        autocomplete="off"
        spellcheck="false"
        bind:value={message}
        on:keydown={messageKeydown}
        on:input={typingStart}
    />
    <button on:click={sendMessage}>Send Message</button>
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
    textarea,
    button {
        font-size: 30px;
    }

    main {
        width: 100%;

        text-align: center;
    }
</style>
