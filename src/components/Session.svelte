<script>
    import { getContext } from 'svelte'

    export let session

    const { getSession, getSocket } = getContext('key')

    let { publicID, typing, username, visible } = session

    const self = publicID === getSession().publicID

    const kick = id => {
        getSocket().emit('kick', id)
    }
</script>

<li>
    {visible ? '🟢' : '⚫'}
    {username}
    {#if self} {'(you)'} {/if}
    <button on:click={() => kick(publicID)}>Kick</button>
    {typing ? '⌨️ typing...' : ''}
</li>

<style lang="scss">
    button {
        font-size: 30px;
    }
</style>
