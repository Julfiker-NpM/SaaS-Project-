import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, firebaseReady } from '../services/firebase'
import { useAuth } from '../hooks/useAuth'

const emptyForm = { name: '', email: '', phone: '' }

export default function Customers() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!firebaseReady || !db || !user?.uid) {
      setLoading(false)
      return
    }
    const q = query(
      collection(db, 'customers'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false),
    )
  }, [user?.uid])

  function startEdit(c) {
    setEditingId(c.id)
    setForm({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!firebaseReady || !db || !user?.uid) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        userId: user.uid,
      }
      if (editingId) {
        await updateDoc(doc(db, 'customers', editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        })
        cancelEdit()
      } else {
        await addDoc(collection(db, 'customers'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
        setForm(emptyForm)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!db || !confirm('Delete this customer?')) return
    await deleteDoc(doc(db, 'customers', id))
    if (editingId === id) cancelEdit()
  }

  if (!firebaseReady) {
    return (
      <p className="text-slate-600 dark:text-slate-400">
        Configure Firebase to manage customers.
      </p>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
        Customers
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Keep a list of buyers for faster order entry.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No customers yet.</p>
        ) : (
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                  Name
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                  Email
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                  Phone
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {c.email || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {c.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 hover:underline dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
