<script>
    import { getContext } from 'svelte'
    import { showKickButton } from '../scripts/settings'

    export let session

    const { getSession, getSocket } = getContext('global')
    const socket = getSocket()

    let { publicID, typing, username, visible, connected } = session

    const self = publicID === getSession().publicID

    const kick = id => {
        socket.emit('kick', id)
    }
</script>

<!-- NOTE: prevents Flash of Unstyled User... svelte thing maybe -->
{#if publicID}
    <li class:disconnected={!connected}>
        {#if connected} {visible ? '🟢' : '⚫'} {/if}
        {username}
        {#if self} {'(you)'} {/if}
        {#if $showKickButton}
            <button on:click={() => kick(publicID)}>Kick</button>
        {/if}
        {typing ? '⌨️ typing...' : ''}
    </li>
{/if}

<style lang="scss">
    button {
        font-size: 30px;
    }

    li {
        list-style: none;
    }

    .disconnected {
        text-decoration: line-through;
    }
</style>
