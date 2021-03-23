// NOTE: default to in-memory database if we're not in production
let database = (() => {
    // NOTE: we use a map to mimic the repl.it database's string keys
    const database = {}
    // WARN: should we be serializing?
    return {
        get: key => Promise.resolve(key in database ? database[key] : null),
        set: (key, value) => Promise.resolve((database[key] = value)),
        getAll: () => Promise.resolve(database)
    }
})()

if (process.env.NODE_ENV === 'production') {
    const Database = require('@replit/database')
    database = new Database()
}

module.exports = {
    database
}
