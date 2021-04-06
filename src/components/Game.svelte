<script>
    import { onMount, tick } from 'svelte'
    import { current_component } from 'svelte/internal'

    let canvas

    let width, height

    const redraw = async () => {
        if (ctx) {
            await tick()
            draw()
        }
    }

    const keys = {}

    $: redraw(width, height)

    let ctx

    let coords = { x: 0, y: 0 }

    const speed = 3

    const idk = {}

    const order = [
        ['down', 'left'],
        ['down', null],
        ['down', 'right'],
        [null, 'left'],
        [null, 'right'],
        ['up', 'left'],
        ['up', null],
        ['up', 'right']
    ]

    let vertical = 'down'
    let horizontal = null

    let frame = 0

    $: direction = [vertical, horizontal]

    let click = 0
    let ticks = 7

    const gameLoop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        let hasMoved = false

        if (keys.w) {
            coords.y -= speed
            vertical = 'up'
            hasMoved = true
        } else if (keys.s) {
            coords.y += speed
            vertical = 'down'
            hasMoved = true
        } else {
            vertical = null
        }
        if (keys.a) {
            coords.x -= speed
            horizontal = 'left'
            hasMoved = true
        } else if (keys.d) {
            coords.x += speed
            horizontal = 'right'
            hasMoved = true
        } else {
            horizontal = null
        }

        if (hasMoved) {
            click++
            if (click > ticks) {
                click = 0
                frame = (frame + 1) % 8
            }
        }

        draw()
        requestAnimationFrame(gameLoop)
    }

    const magic = img => {}

    const img = new Image()
    img.src = 'sprite.png'
    img.onload = ({ path: [img] }) => {
        magic(img)
        // WarN: what if this gets called
        //       before ctx is initted
        gameLoop()
    }

    onMount(() => {
        ctx = canvas.getContext('2d')
    })

    const draw = () => {
        const { x, y } = coords
        const test = ([v, h]) => v === direction[0] && h === direction[1]
        const row = Math.abs(order.findIndex(test))
        const col = frame
        ctx.drawImage(img, col * 60, row * 110, 60, 110, x, y, 60, 110)
    }

    const setKey = (key, value) => (keys[key] = value)
    const keydown = ({ key }) => setKey(key, true)
    const keyup = ({ key }) => setKey(key, false)
</script>

<svelte:window
    bind:innerHeight={height}
    bind:innerWidth={width}
    on:keydown={keydown}
    on:keyup={keyup}
/>

<canvas bind:this={canvas} {width} {height} />

<style lang="scss">
    @use '../style/mixins.scss' as *;

    canvas {
        top: 0;
        left: 0;
        position: fixed;
        z-index: -1;
    }
</style>
