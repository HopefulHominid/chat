// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp } from 'firebase/app'

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    doc,
    setDoc
} from 'firebase/firestore'

const initFirebase = () => {
    // do we need to store the return value? cross that bridge?
    initializeApp({
        apiKey: 'AIzaSyCEmMP-Zxtv99o1_NIZ_FtOK6DPaEN5bpM',
        authDomain: 'racket-a4f35.firebaseapp.com',
        projectId: 'racket-a4f35',
        storageBucket: 'racket-a4f35.appspot.com',
        messagingSenderId: '856702305510',
        appId: '1:856702305510:web:a3ee718ec83c62f9872727'
    })

    return getFirestore()
}

const makeDevDatabase = () => {
    const DEBUG = false
    // NOTE: we use an object literal to mimic
    //       the repl.it database's string keys
    const database = {}
    // NOTE: maybe we could be doing something w/ `this` here... but who cares
    //       this (ayy) works for now
    const get = key => {
        const result = key in database ? JSON.parse(database[key]) : undefined
        if (DEBUG) console.log('get', key, result)
        return result
    }
    return {
        get,
        set: (key, value) => {
            if (typeof value !== 'object') {
                throw TypeError(
                    `Function setDoc() called with invalid data. Data must be an object, but it was: ${value}`
                )
            }
            const existing = get(key)
            let set
            if (existing !== undefined) {
                for (const prop in value) {
                    existing[prop] = value[prop]
                }
                set = existing
            } else {
                set = value
            }
            database[key] = JSON.stringify(set)
            if (DEBUG) console.log('set', key, 'to', JSON.stringify(set))
        },
        getAll: () => {
            const decoded = {}
            for (const key in database) decoded[key] = JSON.parse(database[key])
            if (DEBUG) console.log('getAll', decoded)
            return decoded
        }
        // delete: key => Promise.resolve(delete database[key])
    }
}

const makeProdDatabase = () => {
    const db = initFirebase()

    const database = {
        // NOTE: returns undefined if document doesn't exist
        get: async key => (await getDoc(doc(db, 'users', key))).data(),
        set: async (key, value) =>
            await setDoc(doc(db, 'users', key), value, { merge: true }),
        getAll: async () => {
            const querySnapshot = await getDocs(collection(db, 'users'))
            const result = {}
            querySnapshot.forEach(doc => (result[doc.id] = doc.data()))
            return result
        }
        // delete: key => Promise.resolve(delete database[key])
    }

    return database
}

let database =
    process.env.NODE_ENV === 'production'
        ? makeProdDatabase()
        : makeDevDatabase()

export { database }
