import { NavLink } from 'react-router-dom'

const linkClass =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors'
const activeClass = 'bg-indigo-600 text-white shadow-sm'
const idleClass =
  'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'

export default function Sidebar() {
  const nav = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/orders', label: 'Orders' },
    { to: '/products', label: 'Products' },
    { to: '/customers', label: 'Customers' },
  ]

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 px-4 py-5 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Inventory
        </p>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">
          Order Manager
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : idleClass}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
