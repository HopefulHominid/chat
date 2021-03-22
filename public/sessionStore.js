const { database } = require('./database')

const sessionStore = {
    findSession: async privateID => await database.get(privateID),
    saveSession: database.set,
    findAllSessions: () => Object.values(database.getAll())
}

module.exports = {
    sessionStore
}
