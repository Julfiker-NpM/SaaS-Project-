import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import {
  auth,
  db,
  firebaseReady,
  googleProvider,
} from '../services/firebase'
import { AuthContext } from './firebaseAuthContext'

async function syncUserProfile(u) {
  if (!db || !u) return
  const ref = doc(db, 'users', u.uid)
  const snap = await getDoc(ref)
  await setDoc(
    ref,
    {
      email: u.email ?? null,
      displayName: u.displayName ?? null,
      photoURL: u.photoURL ?? null,
      lastLoginAt: serverTimestamp(),
      ...(!snap.exists() ? { createdAt: serverTimestamp() } : {}),
    },
    { merge: true },
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    if (!firebaseReady || !auth) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (u && db) {
        syncUserProfile(u).catch((err) => {
          console.error('Firestore user profile sync failed:', err)
        })
      }
    })
  }, [])

  const value = useMemo(() => {
    const resolvedUser = !firebaseReady ? null : user
    const loading = firebaseReady && user === undefined
    return {
      user: resolvedUser,
      loading,
      firebaseReady,
      signInWithGoogle: async () => {
        if (!firebaseReady || !auth || !googleProvider) {
          throw new Error('Firebase is not configured')
        }
        await signInWithPopup(auth, googleProvider)
      },
      signOutUser: async () => {
        if (!auth) return
        await signOut(auth)
      },
    }
  }, [user])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}
