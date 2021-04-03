import { database } from './database.js'

const sessionStore = {
    findSession: async privateID => await database.get(privateID),
    saveSession: async (key, value) => await database.set(key, value),
    findAllSessions: async () => Object.values(await database.getAll()),
    destroy: async () => await database.empty()
}

export { sessionStore }
