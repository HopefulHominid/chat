<script>
    import { io } from 'socket.io-client'
    
    const socket = io()

    // <input /> value binding
    let message = 'your message here'

    // <input /> value binding
    let nickname = 'anonymous'

    let officialNickname = nickname

    const sendMessage = () => {
        if (message) {
            socket.emit('chat message', message)
            add_to_messages(`${officialNickname}: ${message}`)
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
            socket.emit('typing start', `${nickname} is typing...`)
            hook = setTimeout(typingStop, delay)
        } else {
            clearTimeout(hook)
            hook = setTimeout(typingStop, delay)
        }
    }

    const typingStop = () => {
        socket.emit('typing stop', `${nickname} is no longer typing.`)
        typing = false
    }

    const messageKeydown = ({ key }) => {
        key === 'Enter' ? sendMessage() : typingStart()
    }

    const nicknameKeydown = ({ key }) => {
        if (key === 'Enter') updateNickname()
    }

    let messages = []

    let online = []

    // WARN: keeping this just in case. superstitious
    // window.scrollTo(0, document.body.scrollHeight)
    const add_to_messages = str => (messages = [...messages, str])

    const update_online_list = sockets => (online = Object.values(sockets))

    socket.emit('connection', nickname)

    // socket.on('update online')

    socket.on('chat message', add_to_messages)
    socket.on('update nickname', update_online_list)
    socket.on('connection', update_online_list)
    // NOTE: disconnect is reserved
    socket.on('disconnection', update_online_list)
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
    />
    <button on:click={sendMessage}>Send Message</button>
    <input
        autocomplete="off"
        bind:value={nickname}
        on:keydown={nicknameKeydown}
    />
    <button on:click={updateNickname}>Update Nickname</button>
    <ul>
        {#each online as name}
            <li>{name}</li>
        {/each}
    </ul>
</main>

<style lang="scss">
    @use './style/global.scss';
    @use './style/mixins.scss' as *;

    main {
        @include size;

        // text-align: center;
    }
</style>
