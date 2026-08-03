import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from './ui';

const NAV = [
  { to: '/', label: 'Today', end: true },
  { to: '/screening', label: 'Screening' },
  { to: '/consultations', label: 'Appointments' },
  { to: '/coaching', label: 'Coaching' },
  { to: '/journal', label: 'Journal' },
];

export function AppShell() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-edge bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-display text-lg">ADHD Care Hub</span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate sm:inline">{user?.profile?.firstName}</span>
            <Button variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </div>
        <nav aria-label="Main" className="mx-auto max-w-5xl overflow-x-auto px-4">
          <ul className="flex gap-1 pb-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-block whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${
                      isActive ? 'border-sage text-ink' : 'border-transparent text-slate hover:text-ink'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 pt-4">
        <p className="text-xs text-slate">
          This service supports self-management and access to care. It does not diagnose ADHD and does not
          replace medical advice. In an emergency call 112.
        </p>
      </footer>
    </div>
  );
}
