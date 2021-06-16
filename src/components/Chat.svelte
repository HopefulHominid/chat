<script>
    import { getContext, tick } from 'svelte'
    import MessageList from './MessageList.svelte'

    export let messages

    const { getSession, getSocket, uglyUpdate } = getContext('global')
    const socket = getSocket()
    const session = getSession()

    let message = 'your message here'
    let typingEndDelay = 2 * 1e3
    let typingHook
    let typing = false

    // NOTE: allows us to see our own typing... event
    $: {
        session.typing = typing
        uglyUpdate()
    }

    const messageKeydown = e => {
        // WARN: kinda complex behavior, maybe we should avoid
        if (e.key === 'Enter') {
            if (e.ctrlKey || e.altKey) {
                message += '\n'
            } else if (e.shiftKey) {
                // TODO: why is this empty ?
            } else {
                sendMessage()
                e.preventDefault()
            }
        }
    }

    const typingStart = () => {
        !typing
            ? socket.emit('typing', (typing = true))
            : clearTimeout(typingHook)
        typingHook = setTimeout(typingStop, typingEndDelay)
    }

    const typingStop = () => {
        socket.emit('typing', (typing = false))
        clearTimeout(typingHook)
    }

    const sendMessage = () => {
        if (message) {
            const { publicID, username } = session

            const richMessage = {
                timestamp: Date.now(),
                message,
                // NOTE: we send username so that if user sends 5 uninterrupted
                //       messages, changing their username each time, we can
                //       display their new username w/ new message each time
                //       maybe we don't want this behavior, and instead want to
                //       retroactively overwrite username. in that case we don't
                //       need to send this anymore
                session: { id: publicID, username }
            }

            addMessage(richMessage)

            socket.emit('chat message', richMessage)

            typingStop()

            message = ''
        }
    }

    const addMessage = async richMessage => {
        messages = [...messages, richMessage]
        await tick()
        window.scrollTo(0, document.body.scrollHeight)
    }

    socket.on('chat message', addMessage)
</script>

<MessageList {messages} />
<textarea
    autocomplete="off"
    spellcheck="false"
    bind:value={message}
    on:keydown={messageKeydown}
    on:input={typingStart}
/>
<button on:click={sendMessage}>Send Message</button>

<style>
    textarea,
    button {
        font-size: 30px;
    }
</style>
