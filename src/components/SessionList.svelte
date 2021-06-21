<!-- TODO: maybe just get rid of this component ? -->
<script>
    import Session from './Session.svelte'

    export let sessions
</script>

<ul>
    <!-- WARN: is the (sessions) key here necessary ? -->
    {#each sessions as session (sessions)}
        <Session {session} />
    {/each}
</ul>
