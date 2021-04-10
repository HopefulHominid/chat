import { derived, writable } from 'svelte/store'
import * as contrastColorLibrary from 'contrast-color'

// custom bandaid for bad library architecture
const contrast = contrastColorLibrary.contrastColor.bind({})

export const centerChat = writable(false)
export const showKickButton = writable(false)
export const backgroundColor = writable('#87ceeb') // skyblue
export const textColor = derived(backgroundColor, $backgroundColor =>
    contrast({ bgColor: $backgroundColor })
)
