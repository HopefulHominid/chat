import { database } from './database.js'

const sessionStore = {
    findSession: async privateID => await database.get(privateID),
    saveSession: async (key, value) => await database.set(key, value),
    findAllSessions: async () => Object.values(await database.getAll()),
    forget: async publicID => {
        const all = await database.getAll()
        const found = Object.entries(all).find(
            ([privateID, session]) => session.publicID === publicID
        )
        if (found) await database.delete(found[0])
    }
}

export { sessionStore }
