import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db, firebaseReady } from '../services/firebase'
import { useAuth } from '../hooks/useAuth'

const LOW_STOCK_THRESHOLD = 10

function StatCard({ title, value, hint, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
    indigo:
      'border-indigo-200 bg-indigo-50/80 dark:border-indigo-900 dark:bg-indigo-950/40',
    amber:
      'border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/40',
  }
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${tones[tone] || tones.slate}`}
    >
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{hint}</p>
      )}
    </div>
  )
}

function firestoreErrMessage(err) {
  const code = err?.code || ''
  if (code === 'permission-denied') {
    return 'Firestore permission denied. Publish the rules from firestore.rules in Firebase Console (or run npm run firebase:deploy:firestore).'
  }
  return err?.message || 'Could not load dashboard data.'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    orderCount: 0,
    totalSales: 0,
    lowStock: 0,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!firebaseReady || !db || !user?.uid) {
      return
    }

    const uid = user.uid
    const productsQ = query(
      collection(db, 'products'),
      where('userId', '==', uid),
    )
    const ordersQ = query(
      collection(db, 'orders'),
      where('userId', '==', uid),
    )

    let products = []
    let orders = []

    function merge() {
      const orderCount = orders.length
      const totalSales = orders.reduce((sum, o) => {
        const n = Number(o.total) || 0
        return sum + n
      }, 0)
      const lowStock = products.filter(
        (p) => Number(p.quantity) < LOW_STOCK_THRESHOLD,
      ).length
      setStats((prev) => ({
        ...prev,
        orderCount,
        totalSales,
        lowStock,
        loading: false,
        error: null,
      }))
    }

    function onListenError(err) {
      console.error(err)
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: firestoreErrMessage(err),
      }))
    }

    const unsubP = onSnapshot(
      productsQ,
      (snap) => {
        products = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        merge()
      },
      onListenError,
    )
    const unsubO = onSnapshot(
      ordersQ,
      (snap) => {
        orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        merge()
      },
      onListenError,
    )

    return () => {
      unsubP()
      unsubO()
    }
  }, [user?.uid])

  if (!firebaseReady) {
    return (
      <p className="text-slate-600 dark:text-slate-400">
        Configure Firebase to see dashboard metrics.
      </p>
    )
  }

  if (stats.loading && !stats.error) {
    return (
      <p className="text-slate-600 dark:text-slate-400">Loading dashboard…</p>
    )
  }

  if (stats.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        <p className="font-medium">Dashboard could not load</p>
        <p className="mt-2">{stats.error}</p>
      </div>
    )
  }

  const salesDisplay = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(stats.totalSales)

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
        Dashboard
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Overview of orders, revenue, and inventory alerts.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total orders"
          value={stats.orderCount}
          hint="All orders in your workspace"
          tone="indigo"
        />
        <StatCard
          title="Total sales"
          value={salesDisplay}
          hint="Sum of order totals"
          tone="slate"
        />
        <StatCard
          title="Low stock"
          value={stats.lowStock}
          hint={`Products below ${LOW_STOCK_THRESHOLD} units`}
          tone="amber"
        />
      </div>
    </div>
  )
}
