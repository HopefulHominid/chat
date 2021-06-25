// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp } from 'firebase/app'

import {
    addDoc,
    collection,
    doc,
    deleteDoc,
    getFirestore,
    getDoc,
    getDocs,
    setDoc
} from 'firebase/firestore'

const initFirebase = () => {
    // do we need to store the return value? cross that bridge?
    initializeApp({
        apiKey: "AIzaSyCEmMP-Zxtv99o1_NIZ_FtOK6DPaEN5bpM",
        authDomain: "racket-a4f35.firebaseapp.com",
        projectId: "racket-a4f35",
        storageBucket: "racket-a4f35.appspot.com",
        messagingSenderId: "856702305510",
        appId: "1:856702305510:web:a3ee718ec83c62f9872727"
      })

    return getFirestore()
}

const makeDevelopmentDatabase = () => {
    const DEBUG = true
    let uid = (() => {
        let uid = 0
        return () => `UID-${uid++}`
    })()
    // NOTE: we could use a map here... but i think we only
    //       ever need string ids for Firebase purposes
    const database = {}
    // NOTE: maybe we could be doing something w/ `this` here... but who cares
    //       this (ayy) works for now
    // NOTE: maybe we should just name this collectionName in the first place ?
    //       but feels better from the consumer's perspective to leave it this way ?
    //       does it ... ?
    const get = ({ collection: collectionName, id }) => {
        let result
        const collection = database[collectionName]
        if (collection && id in collection) {
            result = JSON.parse(collection[id])
        }
        if (DEBUG)
            console.log(
                `get: db[${collectionName}][${id}] = ${JSON.stringify(
                    result,
                    null,
                    2
                )}`
            )
        return result
    }
    return {
        get,
        set: ({ collection, id, merge }) => {
            // NOTE: would TS remove need for this ? probably ?
            if (typeof merge !== 'object') {
                throw TypeError(
                    `Function setDoc() called with invalid data. Data must be an object, but it was: ${merge}`
                )
            }

            // NOTE: add collection if it's not there, as Firebase does
            if (!(collection in database)) database[collection] = {}

            let currentData = get({ collection, id })

            if (currentData !== undefined) {
                for (const prop in merge) currentData[prop] = merge[prop]
            } else {
                currentData = merge
            }

            const storeData = JSON.stringify(currentData)
            const storeID = id || uid()

            database[collection][storeID] = storeData

            if (DEBUG) {
                console.log(`set: db[${collection}][${storeID}] = ${storeData}`)
            }
        },
        getAll: collectionName => {
            const decoded = {}
            const collection = database[collectionName]
            for (const key in collection) {
                decoded[key] = JSON.parse(collection[key])
            }
            if (DEBUG) {
                console.log(
                    `getAll: db[${collectionName}] = ${JSON.stringify(
                        decoded,
                        null,
                        2
                    )}`
                )
            }
            return decoded
        },
        // NOTE: right now this is hardcoded to delete from 'users' collection only
        delete: id => delete database['users'][id]
    }
}

const makeProductionDatabase = () => {
    const db = initFirebase()

    const database = {
        // NOTE: returns undefined if document doesn't exist
        get: async ({ collection, id }) => {
            return (await getDoc(doc(db, collection, id))).data()
        },
        set: async ({ collection: collectionName, id, merge }) => {
            if (id) {
                await setDoc(doc(db, collectionName, id), merge, {
                    merge: true
                })
            } else {
                await addDoc(collection(db, collectionName), merge)
            }
        },
        getAll: async collectionName => {
            const querySnapshot = await getDocs(collection(db, collectionName))
            const result = {}
            querySnapshot.forEach(doc => (result[doc.id] = doc.data()))
            return result
        },
        delete: async id => await deleteDoc(doc(db, 'users', id))
    }

    return database
}

let database =
    process.env.NODE_ENV === 'production'
        ? makeProductionDatabase()
        : makeDevelopmentDatabase()

export { database }
