const gcd = (a, b) => !b ? a : gcd(b, a % b)

export const lcm = (a, b) => ~~(Math.abs(a * b) / gcd(a, b))
