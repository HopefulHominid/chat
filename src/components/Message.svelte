<script>
    import Link from './Link.svelte'
    import { centerChat } from '../scripts/settings.js'

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
    <li class="username">{username}</li>
{/if}

<li class:leftMessage={!$centerChat} title={formatter.format(timestamp)}>
    {#if url}
        <Link {url} />
    {:else}
        {text}
    {/if}
</li>

<style lang="scss">
    .username {
        display: inline-block;
        border: 3px solid var(--color);
        border-radius: 20px;
        padding: 5px;
        margin: 5px;
    }

    .leftMessage {
        // box-shadow: 0 0 26px 11px black;
        width: fit-content;
        padding-left: 5px;
        // background-color: var(--bgColor);
    }

    li {
        font-family: monospace;
        list-style: none;
    }
</style>
