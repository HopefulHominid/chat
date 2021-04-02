<script>
    import { range, style } from './scripts/utils.js'

    export let player

    let playerIndex = 0

    const makeSquare = i => ({ name: `t${i}`, value: '' })

    let squares = range(9).map(makeSquare)

    const players = []
</script>

<p>{players[playerIndex].id === player ? 'move!' : 'waiting ...'}</p>

<div id="grid">
    {#each squares as { name, value }}
        <div class="square" use:style={{ 'grid-area': name }}>{value}</div>
    {/each}
</div>

<style lang="scss">
    @use '../style/mixins.scss' as *;

    #grid {
        background-color: blue;
        display: grid;
        gap: 1vmin;
        height: 200px;
        width: 200px;
        grid-template-rows: 0 repeat(3, minmax(0, 1fr)) 0;
        grid-template-columns: 0 repeat(3, minmax(0, 1fr)) 0;
        grid-template-areas:
            '. .  .  .  .'
            '. t0 t1 t2 .'
            '. t3 t4 t5 .'
            '. t6 t7 t8 .'
            '. .  .  .  .';
    }

    .square {
        background-color: red;
        @include center;
        font-size: 10px;
    }
</style>
