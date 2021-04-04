<script>
    import { centerChat, showKickButton } from '../scripts/settings.js'

    let visible = false
</script>

<button on:click={() => (visible = !visible)}>Settings</button>

{#if visible}
    <label for="showKickButton">Kick Button</label>
    <input id="showKickButton" type="checkbox" bind:checked={$showKickButton} />
    <label for="centerChat">Center Chat</label>
    <input id="centerChat" type="checkbox" bind:checked={$centerChat} />
{/if}

<style>
    button,
    input, label {
        font-size: 30px;
    }
</style>
