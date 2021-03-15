<script>
    import { io } from 'socket.io-client'

    import Game from './Game.svelte'
    const rps = ['🤚', '🤜', '✌️']

    const socket = io({
        // NOTE: need a chance to attach the saved sessionID to the socket
        autoConnect: true
    })
    // socket.auth = { sessionID: localStorage.getItem('sessionID') }
    // socket.connect()

    let sockets = {}

    // <input /> value binding
    let message = 'your message here'

    // <input /> value binding
    let nickname = 'anonymous'

    let visible

    $: if (visible) unread = false

    const attachEvents = () => {
        socket.on('visibility', ({ id, visible }) => {
            if (sockets[socket.id]) sockets[id].visible = visible
        })

        // socket.on('cise', console.log)

        // socket.on('session', ({ sessionID, userID, username }) => {
        //     socket.auth = { sessionID }

        //     localStorage.setItem('sessionID', sessionID)

        //     socket.userID = userID

        //     nickname = username
        // })

        socket.on('chat message', msg => {
            if (!visible) unread = true
            add_to_messages(msg)
        })
        socket.on('challenge', id => {
            sockets[socket.id].from.push(id)
            // have to do reactive update b/c we use push
            sockets = sockets
        })
        socket.on('challenge accept', id => (challenge = id))
        socket.on('sockets', value => (sockets = value))
        socket.on('disconnection', id => {
            delete sockets[id]
            // trigger reactivity just in case... idk if necessary
            sockets = sockets
        })
        socket.on(
            'update nickname',
            ({ id, name }) => (sockets[id].name = name)
        )
        socket.on('typing start', id => (sockets[id].typing = true))
        socket.on('typing stop', id => (sockets[id].typing = false))
    }

    attachEvents()

    const updateVisible = () => {
        visible = document.visibilityState === 'visible'
        socket.emit('visibility', visible)
        // WARN: our default of visible: true might be hiding the fact
        //       that we miss the first value from an update here
        if (sockets[socket.id]) sockets[socket.id].visible = visible
    }
    updateVisible()
    document.addEventListener('visibilitychange', updateVisible)

    let challenge = null

    const issueChallenge = id => {
        socket.emit('challenge', id)
        sockets[socket.id].to.push(id)
        sockets[id].from.push(socket.id)
        // have to force sockets update if we gon do push here
        sockets = sockets
    }

    const acceptChallenge = id => {
        socket.emit('challenge accept', id)
        sockets[id].challenge = true
        challenge = id
    }

    let lastMessage

    const sendMessage = () => {
        if (message) {
            const formatter = new Intl.DateTimeFormat('en', {
                dateStyle: 'long',
                timeStyle: 'medium',
                calendar: 'japanese'
            })
            socket.emit('chat message', message)
            add_to_messages({
                timestamp: formatter.format(Date.now()),
                username: sockets[socket.id].name,
                user: socket.id,
                message
            })
            typingStop()
            message = ''
        }
    }

    const updateNickname = () => {
        if (nickname) {
            socket.emit('update nickname', nickname)
            sockets[socket.id].name = nickname
        }
    }

    let unread = false

    $: faviconType = unread ? 'message' : 'resting'

    let typing = false
    let delay = 2000
    let hook

    const typingStart = () => {
        if (!typing) {
            typing = true
            socket.emit('typing start')
            hook = setTimeout(typingStop, delay)
        } else {
            clearTimeout(hook)
            hook = setTimeout(typingStop, delay)
        }
    }

    const typingStop = () => {
        socket.emit('typing stop')
        typing = false
        clearTimeout(hook)
    }

    const messageKeydown = e => {
        if (e.key === 'Enter') {
            if (e.ctrlKey) {
                message += '\n'
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

    const add_to_messages = msg => {
        messages = [...messages, msg]

        lastMessage = msg.user
        window.scrollTo(0, document.body.scrollHeight)
    }
</script>

<svelte:head>
    <link rel="icon" href="/{faviconType}.ico" />
</svelte:head>

<main>
    <ul>
        {#each messages as { timestamp, username, message, user }, i}
            <li title={timestamp}>
                {messages[i - 1]?.user === user ? '' : `${username}:`}
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
    <ul>
        {#each Object.entries(sockets).sort(([a], [b]) => {
            if (a === b) return 0
            if (b === socket.id) return 1
            if (a === socket.id) return -1
            return 0
        }) as [id, { name, typing, visible }]}
            <li>
                {visible ? '🟢' : '⚫'}
                {name}
                {#if id === socket.id}
                    {'(you)'}
                {:else if sockets[socket.id].from.includes(id)}
                    <button on:click={() => acceptChallenge(id)}
                        >{'Accept'}</button
                    >
                {:else if sockets[socket.id].to.includes(id)}
                    <button disabled>{'waiting for response...'}</button>
                {:else}
                    <button on:click={() => issueChallenge(id)}
                        >{'Challenge'}</button
                    >
                {/if}
                {typing ? '⌨️ typing...' : ''}
            </li>
        {/each}
    </ul>
    <!-- <Game player={socket.id} /> -->
    {#if challenge}
        <h1>{challenge}, let's go!</h1>
    {/if}
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
        @include size;

        // text-align: center;
    }
</style>
