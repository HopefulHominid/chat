<script>
    export let message
    export let showUsername

    const {
        timestamp,
        message: text,
        session: { username }
    } = message
</script>

<li title={timestamp}>
    {showUsername ? `${username}:` : ''}
    <pre>{text}</pre>
</li>
