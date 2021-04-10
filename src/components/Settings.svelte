<script>
    import {
        centerChat,
        showKickButton,
        backgroundColor
    } from '../scripts/settings.js'

    let visible = false

    $: document.body.style.backgroundColor = $backgroundColor
</script>

<button on:click={() => (visible = !visible)}>Settings</button>

{#if visible}
    <label for="showKickButton">Kick Button</label>
    <input id="showKickButton" type="checkbox" bind:checked={$showKickButton} />
    <label for="centerChat">Center Chat</label>
    <input id="centerChat" type="checkbox" bind:checked={$centerChat} />
    <label for="backgroundColor">Background Color</label>
    <input id="backgroundColor" type="color" bind:value={$backgroundColor} />
{/if}

<style>
    button,
    input,
    label {
        font-size: 30px;
    }
</style>
