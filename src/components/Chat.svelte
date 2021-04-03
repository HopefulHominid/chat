<script>
    import { getContext, tick } from 'svelte'
    import MessageList from './MessageList.svelte'
    import { timestamp } from '../scripts/utils.js'

    const { getSession, getSocket } = getContext('global')
    const socket = getSocket()

    let message = 'your message here'
    let messages = []
    let typingEndDelay = 2 * 1e3
    let typingHook
    let typing = false

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
            const { publicID, username } = getSession()

            const richMessage = {
                timestamp: timestamp(),
                message,
                // why not have consumer look up username themselves ?
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

    // NOTE: don't like this... or should i like it? socket is part of the
    //       context after all... we're basically making socket global in
    //       a subtree... idk man
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
