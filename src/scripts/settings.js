import { derived, writable } from 'svelte/store'
import * as contrastColorLibrary from 'contrast-color'

// custom bandaid for bad library architecture
const contrast = contrastColorLibrary.contrastColor.bind({})

const getLocalStorage = key => {
    const check = localStorage.getItem(key)
    return (check !== null) ? JSON.parse(check) : null
}

export const centerChat = writable(getLocalStorage('centerChat') || false)
export const showKickButton = writable(false)
// NOTE: do we need this since it's a string anyway?
//       technically we dont but why have this one inconsistency that we have to
//       remember ? it's like a few bytes of wasted space, it's not worth the
//       maintenance nightmare
export const backgroundColor = writable(
    getLocalStorage('backgroundColor') || '#87ceeb'
) // skyblue
export const textColor = derived(backgroundColor, $backgroundColor =>
    contrast({ bgColor: $backgroundColor })
)

centerChat.subscribe(val =>
    localStorage.setItem('centerChat', JSON.stringify(val))
)
backgroundColor.subscribe(val =>
    localStorage.setItem('backgroundColor', JSON.stringify(val))
)
