<script>
    import { wait } from '../scripts/utils.js'

    export let url

    let title

    let doneFetch = false
    let doneSpinner = false
    $: done = doneFetch && doneSpinner

    fetch(location.href + 'og/?dest=' + encodeURIComponent(url))
        .then(res => res.json())
        .then(juice => (title = juice?.html?.title))
        .catch(console.error)
        .finally(() => (doneFetch = true))

    const minSpinnerTime = 900
    const dotCount = 4
    const dotPause = minSpinnerTime / dotCount
    let dots = ''

    ;(async () => {
        for (let i = 0; i < dotCount; i++) {
            dots += '.'
            await wait(dotPause)
        }
        doneSpinner = true
    })()
</script>

{#if !doneSpinner}
    {dots}
{:else}
    <a href={url}>{title || url}</a>
{/if}
