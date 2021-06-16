const gcd = (a, b) => (!b ? a : gcd(b, a % b))

export const lcm = (a, b) => ~~(Math.abs(a * b) / gcd(a, b))

export const range = n => [...Array(n).keys()]

const inlineStyleDeclarations = declarations => {
    return Object.entries(declarations)
        .map(([property, value]) => `${property}:${value};`)
        .join('')
}

export const style = (node, styles = {}) => {
    const update = styles => (node.style = inlineStyleDeclarations(styles))
    update(styles)
    return { update }
}

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
