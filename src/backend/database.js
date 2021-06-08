// TODO: pull request this guy to make the ES6 migration ? make new package ?
import { Database } from './replit.js'

// NOTE: default to in-memory database if we're not in production
let database = (() => {
    // NOTE: we use an object literal to mimic
    //       the repl.it database's string keys
    const database = {}
    return {
        get: key => Promise.resolve(key in database ? database[key] : null),
        // WARN: should we be serializing?
        set: (key, value) => Promise.resolve((database[key] = value)),
        getAll: () => Promise.resolve(database),
        delete: key => Promise.resolve(delete database[key])
    }
})()

if (process.env.NODE_ENV === 'production') {
    database = new Database(process.env.REPLIT_DB_URL)
}

export { database }
