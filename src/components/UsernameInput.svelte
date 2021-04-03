<script>
    import { getContext } from 'svelte'

    const { getSession, getSocket, uglyUpdate } = getContext('global')
    const socket = getSocket()

    export let username

    const updateNickname = () => {
        if (username) {
            socket.emit('username', username)

            getSession().username = username
            uglyUpdate()
        }
    }

    const nicknameKeydown = ({ key }) => {
        if (key === 'Enter') updateNickname()
    }
</script>

<input autocomplete="off" bind:value={username} on:keydown={nicknameKeydown} />
<button on:click={updateNickname}>Update Username</button>

<style>
    input,
    button {
        font-size: 30px;
    }
</style>
