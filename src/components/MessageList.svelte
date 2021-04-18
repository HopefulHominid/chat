<script>
    import Message from './Message.svelte'

    export let messages

    const showUsername = i => {
        let show = true
        const prevMessage = messages[i - 1]

        if (prevMessage) {
            const { id: prevID, username: prevUsername } = prevMessage.session
            const { id, username } = messages[i].session

            show = prevID !== id || prevUsername !== username
        }

        return show
    }
</script>

<ul>
    {#each messages as message, i (message)}
        <Message {message} showUsername={showUsername(i)} />
    {/each}
</ul>
