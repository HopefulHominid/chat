import { database } from './database.js'

const sessionStore = {
    // given a privateID, finds the user document in the users collection
    // with that id
    findSession: async privateID =>
        await database.get({
            collection: 'users',
            id: privateID
        }),
    // TODO: this could have a more descriptive name, given we sometimes
    //       save publicID + username, and sometimes just username
    saveSession: async (privateID, session) =>
        await database.set({
            collection: 'users',
            id: privateID,
            merge: session
        }),
    allSessions: async () => Object.values(await database.getAll('users')),
    forgetUser: async publicID => {
        const all = await database.getAll('users')
        const found = Object.entries(all).find(
            ([_privateID, session]) => session.publicID === publicID
        )
        if (found) await database.delete(found[0])
    }
}

const messageStore = {
    saveMessage: async message =>
        await database.set({
            collection: 'messages',
            merge: message
        }),
    allMessages: async () => Object.values(await database.getAll('messages'))
}

export { sessionStore, messageStore }
