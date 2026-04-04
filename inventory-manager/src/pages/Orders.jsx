import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, firebaseReady } from '../services/firebase'
import { useAuth } from '../hooks/useAuth'

const statusOptions = ['pending', 'completed', 'cancelled']

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [lines, setLines] = useState([{ productId: '', quantity: '1' }])
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!firebaseReady || !db || !user?.uid) {
      setLoading(false)
      return
    }
    const uid = user.uid
    const unsubO = onSnapshot(
      query(
        collection(db, 'orders'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
      ),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false),
    )
    const unsubP = onSnapshot(
      query(
        collection(db, 'products'),
        where('userId', '==', uid),
        orderBy('name'),
      ),
      (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    )
    const unsubC = onSnapshot(
      query(
        collection(db, 'customers'),
        where('userId', '==', uid),
        orderBy('name'),
      ),
      (snap) => setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    )
    return () => {
      unsubO()
      unsubP()
      unsubC()
    }
  }, [user?.uid])

  const customerName = useMemo(() => {
    if (!customerId) return ''
    const c = customers.find((x) => x.id === customerId)
    return c?.name || ''
  }, [customerId, customers])

  function addLine() {
    setLines((L) => [...L, { productId: '', quantity: '1' }])
  }

  function setLine(i, patch) {
    setLines((L) => L.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }

  function removeLine(i) {
    setLines((L) => L.filter((_, j) => j !== i))
  }

  async function handleCreateOrder(e) {
    e.preventDefault()
    setFormError('')
    if (!firebaseReady || !db || !user?.uid) return

    const cleaned = lines
      .filter((l) => l.productId)
      .map((l) => ({
        productId: l.productId,
        quantity: Math.max(1, Number(l.quantity) || 1),
      }))

    if (cleaned.length === 0) {
      setFormError('Add at least one line with a product.')
      return
    }

    setSaving(true)
    try {
      await runTransaction(db, async (transaction) => {
        const itemPayload = []
        let total = 0

        for (const line of cleaned) {
          const ref = doc(db, 'products', line.productId)
          const snap = await transaction.get(ref)
          if (!snap.exists()) throw new Error('Product not found')
          const data = snap.data()
          if (data.userId !== user.uid) throw new Error('Invalid product')
          const name = data.name || 'Item'
          const unitPrice = Number(data.price) || 0
          const available = Number(data.quantity) || 0
          if (available < line.quantity) {
            throw new Error(`Not enough stock for "${name}" (${available} left)`)
          }
          const lineTotal = unitPrice * line.quantity
          total += lineTotal
          itemPayload.push({
            productId: line.productId,
            name,
            quantity: line.quantity,
            unitPrice,
            lineTotal,
          })
          transaction.update(ref, {
            quantity: available - line.quantity,
            updatedAt: serverTimestamp(),
          })
        }

        const orderRef = doc(collection(db, 'orders'))
        transaction.set(orderRef, {
          userId: user.uid,
          customerId: customerId || null,
          customerName: customerName || null,
          items: itemPayload,
          total,
          status: 'pending',
          createdAt: serverTimestamp(),
        })
      })

      setCustomerId('')
      setLines([{ productId: '', quantity: '1' }])
    } catch (err) {
      setFormError(err?.message || 'Could not create order')
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(orderId, status) {
    if (!db) return
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    })
  }

  async function handleDeleteOrder(o) {
    if (!db || !confirm('Delete this order? Stock is not restored automatically.'))
      return
    await deleteDoc(doc(db, 'orders', o.id))
  }

  if (!firebaseReady) {
    return (
      <p className="text-slate-600 dark:text-slate-400">
        Configure Firebase to manage orders.
      </p>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
        Orders
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Create orders from your catalog; inventory decreases when an order is
        placed.
      </p>

      <form
        onSubmit={handleCreateOrder}
        className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Customer (optional)
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">— None —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Line items
          </p>
          {lines.map((line, i) => (
            <div
              key={i}
              className="flex flex-wrap items-end gap-2 border-b border-slate-100 pb-3 dark:border-slate-800"
            >
              <div className="min-w-[180px] flex-1">
                <select
                  value={line.productId}
                  onChange={(e) => setLine(i, { productId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (stock: {p.quantity ?? 0})
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                min="1"
                value={line.quantity}
                onChange={(e) => setLine(i, { quantity: e.target.value })}
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLine}
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            + Add line
          </button>
        </div>

        {formError && (
          <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
        )}

        <button
          type="submit"
          disabled={saving || products.length === 0}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Placing order…' : 'Place order'}
        </button>
      </form>

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Recent orders
        </h3>
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: 'USD',
                      }).format(Number(o.total) || 0)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {o.customerName || 'Walk-in'}{' '}
                      ·{' '}
                      {o.createdAt?.toDate
                        ? o.createdAt.toDate().toLocaleString()
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={o.status || 'pending'}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(o)}
                      className="text-xs text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  {(o.items || []).map((it, idx) => (
                    <li key={idx}>
                      {it.name} × {it.quantity} @{' '}
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: 'USD',
                      }).format(Number(it.unitPrice) || 0)}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
