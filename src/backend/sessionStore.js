import { database } from './database.js'

const sessionStore = {
    // given a privateID, finds the user document in the users collection
    // with that id
    findSession: async privateID => await database.get(privateID),
    saveSession: async (key, value) => await database.set(key, value),
    findAllSessions: async () => Object.values(await database.getAll())
    // forget: async publicID => {
    //     const all = await database.getAll()
    //     const found = Object.entries(all).find(
    //         ([privateID, session]) => session.publicID === publicID
    //     )
    //     if (found) await database.delete(found[0])
    // }
}

const messageStore = {
    saveMessage: async message => {},
    allMessages: async publicID => {}
}

export { sessionStore, messageStore }
