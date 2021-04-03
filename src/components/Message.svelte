<script>
    // import { getContext } from 'svelte'

    export let message
    export let showUsername

    const {
        timestamp,
        message: text,
        session: { username }
    } = message

    // const { getSession, getSocket } = getContext('key')
</script>

<li title={timestamp}>
    {showUsername ? `${username}:` : ''}
    <pre>{text}</pre>
</li>
