<script>
    import Session from './Session.svelte'

    export let list
</script>

<ul>
    {#each list as session (list)}
        <Session {session} />
    {/each}
</ul>
