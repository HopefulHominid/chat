// TODO: pull request this guy to make the ES6 migration ? make new package ?
import { Database } from './replit.js'

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
    database = new Database(process.env.REPLIT_DB_URL)
    // database = new Database(
    //     'https://kv.replit.com/v0/eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MTc0OTMxNjcsImlhdCI6MTYxNzM4MTU2NywiaXNzIjoiY29ubWFuIiwiZGF0YWJhc2VfaWQiOiIwMmNkYzcyYS1jMmI0LTRhYmUtOTM2NC01ZGZjMzBiNWVlYjkifQ.PSB7aTUwCwqyTTl7aojHtwQBvXOq4GM77xvlC0XDuK70zio1E5hEfLdBoTybNx5FGjtPFBsKDX_W124iC1Q5mQ'
    // )
}

export { database }
