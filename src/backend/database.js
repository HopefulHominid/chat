// Firebase App (the core Firebase SDK) is always required and must be listed first
import { initializeApp } from 'firebase/app'

import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore'

// do we need to store the return value? cross that bridge?
initializeApp({
    apiKey: 'AIzaSyCEmMP-Zxtv99o1_NIZ_FtOK6DPaEN5bpM',
    authDomain: 'racket-a4f35.firebaseapp.com',
    projectId: 'racket-a4f35',
    storageBucket: 'racket-a4f35.appspot.com',
    messagingSenderId: '856702305510',
    appId: '1:856702305510:web:a3ee718ec83c62f9872727'
})

const db = getFirestore()

const test = async () => {
    try {
        let docRef = await addDoc(collection(db, 'users'), {
            first: 'Ada',
            last: 'Lovelace',
            born: 1815
        })
        console.log('Document written with ID: ', docRef.id)
        docRef = await addDoc(collection(db, 'users'), {
            first: 'Alan',
            middle: 'Mathison',
            last: 'Turing',
            born: 1912
        })
        console.log('Document written with ID: ', docRef.id)
        const querySnapshot = await getDocs(collection(db, 'users'))
        querySnapshot.forEach(doc => {
            console.log(`${doc.id} => ${JSON.stringify(doc.data(), null, 2)}`)
        })
    } catch (e) {
        console.error('Error adding document: ', e)
    }
}

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
    // TODO: hook this up to firebase. or, alternatively, integrate
    //       firebase on the level of session store and nix this file
    database = null
}

export { database }
