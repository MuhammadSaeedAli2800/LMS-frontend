import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ items, sectionLabel, children }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    const destination = user?.role === 'admin' ? '/secure-admin-portal' : '/login';
    setLoggingOut(true);
    try {
      await logout();
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Could not log out.');
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 md:block">
        <Sidebar items={items} label={sectionLabel} />
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-gray-900/40"
            aria-label="Dismiss navigation"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[85vw] bg-slate-900 shadow-lg">
            <Sidebar
              id="mobile-navigation"
              items={items}
              label={sectionLabel}
              onClose={() => setOpen(false)}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}
      <div className="min-w-0 md:pl-64">
        <Navbar
          userName={user?.name || 'Signed in'}
          menuOpen={open}
          onOpenMenu={() => setOpen((current) => !current)}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />
        <main id="main-content" className="px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
