<script>
    let name = 'world'
</script>

<main>
    <h1>Hello {name}</h1>
</main>

<style lang="scss">
    @use './style/global.scss';
    @use './style/mixins.scss' as *;

    main {
        @include size;

        text-align: center;
    }

    h1 {
        color: red;
    }
</style>