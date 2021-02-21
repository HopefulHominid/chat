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

    socket.on('chat message', msg => {
        const item = document.createElement('li')
        item.textContent = msg
        messages.appendChild(item)
        window.scrollTo(0, document.body.scrollHeight)
    })
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
