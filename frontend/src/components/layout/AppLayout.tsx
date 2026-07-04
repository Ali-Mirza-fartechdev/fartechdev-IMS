import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, BarChart3, Settings as SettingsIcon, LogOut,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import logo from '@/assets/logo.png'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function AppLayout() {
  const { signOut, user } = useAuth()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <img src={logo} alt="FAR Tech" className="h-8 w-8" />
          <div>
            <p className="text-sm font-bold leading-tight">FAR Tech &</p>
            <p className="text-sm font-bold leading-tight">Developers</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/15 text-accent-light'
                    : 'text-muted hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <p className="truncate text-xs text-muted">{user?.email}</p>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
