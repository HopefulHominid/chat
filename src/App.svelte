<script>
    import { io } from 'socket.io-client'
    import { onMount } from 'svelte'

    const socket = io()

    // <input /> value binding
    let message = 'your message here'

    // <input /> value binding
    let nickname = 'anonymous'

    let officialNickname = nickname

    // <ul> element binding
    let messages

    const sendMessage = () => {
        if (message) {
            socket.emit('chat message', message)
            add_to_list(`${officialNickname}: ${message}`)
            message = ''
        }
    }

    const updateNickname = () => {
        if (nickname) {
            socket.emit('update nickname', nickname)
            add_to_list(`you changed your name to ${nickname}`)
            officialNickname = nickname
        }
    }

    let typing = false
    let delay = 2000
    let hook

    const typingStart = () => {
        if (!typing) {
            typing = true
            socket.emit('chat message', `${nickname} is typing...`)
            hook = setTimeout(typingStop, delay)
        } else {
            clearTimeout(hook)
            hook = setTimeout(typingStop, delay)
        }
    }

    const typingStop = () => {
        socket.emit('chat message', `${nickname} is no longer typing.`)
        typing = false
    }

    const messageKeydown = ({ key }) => {
        key === 'Enter' ? sendMessage() : typingStart()
    }

    const nicknameKeydown = ({ key }) => {
        if (key === 'Enter') updateNickname()
    }

    const add_to_list = str => {
        const item = document.createElement('li')
        item.textContent = str
        messages.appendChild(item)
        window.scrollTo(0, document.body.scrollHeight)
    }

    socket.emit('connection', nickname)

    onMount(() => add_to_list('you joined'))

    socket.on('chat message', add_to_list)
    socket.on('update nickname', add_to_list)
    socket.on('connection', add_to_list)
    // NOTE: disconnect is reserved
    socket.on('disconnection', add_to_list)
</script>

<main>
    <ul bind:this={messages} />
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
</main>

<style lang="scss">
    @use './style/global.scss';
    @use './style/mixins.scss' as *;

    main {
        @include size;

        // text-align: center;
    }
</style>
