<script>
    import Link from './Link.svelte'

    export let message
    export let showUsername

    const formatter = new Intl.DateTimeFormat('en', {
        dateStyle: 'long',
        timeStyle: 'medium',
        calendar: 'japanese'
    })

    const {
        timestamp,
        message: text,
        session: { username }
    } = message

    let url

    try {
        url = new URL(text)
    } catch (e) {
        if (!(e instanceof TypeError)) throw e
    }
</script>

{#if showUsername}
    <li>{username}:</li>
{/if}

<li title={formatter.format(timestamp)}>
    {#if url}
        <Link {url} />
    {:else}
        <pre>{text}</pre>
    {/if}
</li>
