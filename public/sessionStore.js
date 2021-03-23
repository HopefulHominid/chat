const { database } = require('./database')

const sessionStore = {
    findSession: async privateID => await database.get(privateID),
    saveSession: async (key, value) => await database.set(key, value),
    findAllSessions: async () => Object.values(await database.getAll())
}

module.exports = {
    sessionStore
}
