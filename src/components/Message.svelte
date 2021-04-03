<script>
    // import { getContext } from 'svelte'

    export let message
    export let first

    const {
        timestamp,
        message: text,
        session: { username }
    } = message

    // const { getSession, getSocket } = getContext('key')
</script>

<li title={timestamp}>
    {first ? '' : `${username}:`}
    <pre>{text}</pre>
</li>
