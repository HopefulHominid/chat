<script>
    import Message from './Message.svelte'

    export let messages
</script>

<ul>
    {#each messages as message, i (messages)}
        <Message
            {message}
            first={messages[i - 1]?.session.id === message.session.id}
        />
    {/each}
</ul>
