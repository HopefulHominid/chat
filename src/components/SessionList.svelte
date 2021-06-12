<script>
    import Session from './Session.svelte'

    export let list
</script>

<ul>
    <!-- WARN: is the (list) key here necessary ? -->
    {#each list as session (list)}
        <Session {session} />
    {/each}
</ul>
