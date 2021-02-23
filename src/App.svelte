<script>
    import { io } from 'socket.io-client'

    const socket = io()

    let sockets = {}

    // <input /> value binding
    let message = 'your message here'

    // <input /> value binding
    let nickname = 'anonymous'

    let officialNickname = nickname

    socket.emit('connection', nickname)

    const sendMessage = () => {
        if (message) {
            socket.emit('chat message', message)
            add_to_messages(`${officialNickname}: ${message}`)
            typingStop()
            message = ''
        }
    }

    const updateNickname = () => {
        if (nickname) {
            socket.emit('update nickname', nickname)
            officialNickname = nickname
        }
    }

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
    }

    const messageKeydown = ({ key }) => {
        if (key === 'Enter') sendMessage()
    }

    const nicknameKeydown = ({ key }) => {
        if (key === 'Enter') updateNickname()
    }

    let messages = []

    // WARN: keeping this just in case. superstitious
    // window.scrollTo(0, document.body.scrollHeight)
    const add_to_messages = str => (messages = [...messages, str])

    socket.on('chat message', add_to_messages)
    socket.on('sockets', value => (sockets = value))
    socket.on('typing start', id => (sockets[id].typing = true))
    socket.on('typing stop', id => (sockets[id].typing = false))
</script>

<main>
    <ul>
        {#each messages as message}
            <li>{message}</li>
        {/each}
    </ul>
    <input
        autocomplete="off"
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
        {#each Object.values(sockets) as { name, typing }}
            <li>{name} {typing ? '⌨️ typing...' : ''}</li>
        {/each}
    </ul>
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
        @include size;

        // text-align: center;
    }
</style>
