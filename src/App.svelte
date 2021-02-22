<script>
    import { io } from 'socket.io-client'

    const socket = io()

    let message = 'your message'

    let messages

    const submit = () => {
        if (message) {
            socket.emit('chat message', message)
            message = ''
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
    socket.on('disconnection', add_to_list)
</script>

<main>
    <ul id="messages" bind:this={messages} />
    <form id="form" action="" on:submit|preventDefault={submit}>
        <input id="input" autocomplete="off" bind:value={message} /><button
            >Send</button
        >
    </form>
</main>

<style lang="scss">
    @use './style/global.scss';
    @use './style/mixins.scss' as *;

    main {
        @include size;

        text-align: center;
    }
</style>
