<script>
    import { io } from 'socket.io-client'
    import { tick } from 'svelte'

    // import Game from './Game.svelte'
    // const rps = ['🤚', '🤜', '✌️']

    const socket = io({ autoConnect: false })
    socket.auth = { privateID: localStorage.getItem('privateID') }
    socket.connect()
    socket.onAny((event, ...args) => {
        console.log('client event:', event, args)
    })

    let session = {}

    let sessions = {}

    let message = 'your message here'

    let nickname

    let visible

    $: if (visible) unread = false

    const saveSession = ({ publicID, ...session }) =>
        (sessions[publicID] = session)

    const magic = Math.random()

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

    const die = () => {
        socket.close()
        location.reload()
    }

    const nuke = () => {
        socket.emit('nuke')
        die()
    }

    const kick = id => {
        console.log(id)
        socket.emit('kick', id)
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

        // socket.on('challenge', id => {
        //     sockets[socket.id].from.push(id)
        //     // have to do reactive update b/c we use push
        //     sockets = sockets
        // })
        // socket.on('challenge accept', id => (challenge = id))
    }

    attachEvents()

    const updateVisible = () => {
        const visibleNew = document.visibilityState === 'visible'
        socket.emit('visible', visibleNew)
        session.visible = visibleNew
        visible = visibleNew
    }

    let challenge = null

    const issueChallenge = id => {
        // socket.emit('challenge', id)
        // sockets[socket.id].to.push(id)
        // sockets[id].from.push(socket.id)
        // // have to force sockets update if we gon do push here
        // sockets = sockets
    }

    const acceptChallenge = id => {
        // socket.emit('challenge accept', id)
        // sockets[id].challenge = true
        // challenge = id
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

    $: session.typing = typing

    let delay = 2000
    let hook

    const typingStart = () => {
        if (!typing) {
            socket.emit('typing', (typing = true))
            hook = setTimeout(typingStop, delay)
        } else {
            clearTimeout(hook)
            hook = setTimeout(typingStop, delay)
        }
    }

    const typingStop = () => {
        socket.emit('typing', (typing = false))
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
    <ul>
        {#each [session, ...Object.entries(sessions).map(([publicID, session]) => ({ publicID, ...session }))] as { publicID, username, typing, visible } (publicID)}
            <li>
                {visible ? '🟢' : '⚫'}
                {username}
                {#if publicID === session.publicID}
                    {'(you)'}
                    <!-- {:else if sockets[socket.id].from.includes(id)}
                    <button on:click={() => acceptChallenge(id)}
                        >{'Accept'}</button
                    >
                {:else if sockets[socket.id].to.includes(id)}
                    <button disabled>{'waiting for response...'}</button>
                {:else}
                    <button on:click={() => issueChallenge(id)}
                        >{'Challenge'}</button
                    > -->
                {/if}
                <button on:click={() => kick(publicID)}>Kick</button>
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
        width: 100%;

        // text-align: center;
    }
</style>
