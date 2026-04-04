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

const emptyForm = { name: '', sku: '', price: '', quantity: '' }

export default function Products() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [listError, setListError] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    if (!firebaseReady || !db || !user?.uid) {
      setLoading(false)
      return
    }
    setListError(null)
    const q = query(
      collection(db, 'products'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setListError(null)
      },
      (err) => {
        console.error(err)
        setLoading(false)
        setListError(
          err?.code === 'permission-denied'
            ? 'Permission denied: publish firestore.rules in Firebase Console.'
            : err?.message || 'Could not load products.',
        )
      },
    )
  }, [user?.uid])

  function startEdit(p) {
    setEditingId(p.id)
    setForm({
      name: p.name || '',
      sku: p.sku || '',
      price: String(p.price ?? ''),
      quantity: String(p.quantity ?? ''),
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
    setSubmitError(null)
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: Number(form.price) || 0,
        quantity: Number(form.quantity) || 0,
        userId: user.uid,
      }
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        })
        cancelEdit()
      } else {
        await addDoc(collection(db, 'products'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
        setForm(emptyForm)
      }
    } catch (err) {
      console.error(err)
      setSubmitError(
        err?.code === 'permission-denied'
          ? 'Permission denied when saving. Update and publish Firestore rules.'
          : err?.message || 'Save failed.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!db || !confirm('Delete this product?')) return
    await deleteDoc(doc(db, 'products', id))
    if (editingId === id) cancelEdit()
  }

  if (!firebaseReady) {
    return (
      <p className="text-slate-600 dark:text-slate-400">
        Configure Firebase to manage products.
      </p>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Products
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add, edit, and remove inventory items.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <input
          placeholder="SKU"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <input
          required
          type="number"
          min="0"
          step="0.01"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <input
          required
          type="number"
          min="0"
          step="1"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
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

      {submitError && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          {submitError}
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {listError ? (
          <p className="p-6 text-sm text-red-600 dark:text-red-400">
            {listError}
          </p>
        ) : loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No products yet.</p>
        ) : (
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                  Name
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                  SKU
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                  Price
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                  Qty
                </th>
                <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {p.sku || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {new Intl.NumberFormat(undefined, {
                      style: 'currency',
                      currency: 'USD',
                    }).format(Number(p.price) || 0)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        Number(p.quantity) < 10
                          ? 'font-medium text-amber-600 dark:text-amber-400'
                          : ''
                      }
                    >
                      {p.quantity ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
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
