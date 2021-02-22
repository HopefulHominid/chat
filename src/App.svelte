<script>
    import { io } from 'socket.io-client'

    const socket = io()

    // <input /> value binding
    let message = 'your message here'

    // <input /> value binding
    let nickname = 'anonymous'

    // TODO: need some way to emit to other && not myself, so it
    //       can say 'you joined'
    socket.emit('connection', nickname)

    // <ul> element binding
    let messages

    const sendMessage = () => {
        if (message) {
            socket.emit('chat message', message)
            message = ''
        }
    }

    const updateNickname = () => {
        if (nickname) {
            socket.emit('update nickname', nickname)
        }
    }

    const add_to_list = str => {
        const item = document.createElement('li')
        item.textContent = str
        messages.appendChild(item)
        window.scrollTo(0, document.body.scrollHeight)
    }

    socket.on('chat message', add_to_list)
    socket.on('connection', add_to_list)
    // NOTE: disconnect is reserved
    socket.on('disconnection', add_to_list)
</script>

<main>
    <ul bind:this={messages} />
    <input autocomplete="off" bind:value={message} />
    <button on:click={sendMessage}>Send Message</button>
    <input autocomplete="off" bind:value={nickname} />
    <button on:click={updateNickname}>Update Nickname</button>
</main>

<style lang="scss">
    @use './style/global.scss';
    @use './style/mixins.scss' as *;

    main {
        @include size;

        text-align: center;
    }
</style>
