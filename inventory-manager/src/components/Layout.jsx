import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../hooks/useAuth'

export default function Layout() {
  const { user, signOutUser } = useAuth()

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            SaaS inventory
          </h1>
          <div className="flex items-center gap-4">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="h-8 w-8 rounded-full ring-2 ring-slate-200 dark:ring-slate-700"
              />
            )}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {user?.displayName || 'User'}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => signOutUser()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
