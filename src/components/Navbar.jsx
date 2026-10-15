import { KeyRound, LogOut, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Spinner } from './Spinner';

export function Navbar({ userName, onOpenMenu, onLogout, loggingOut = false, menuOpen = false }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/95 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={onOpenMenu}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <p className="max-w-[9rem] truncate text-sm font-medium text-gray-900 sm:max-w-[14rem]">{userName}</p>
        <Link
          to="/change-password"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3"
        >
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Change password</span>
          <span className="sr-only sm:hidden">Change password</span>
        </Link>
        <Button type="button" variant="secondary" onClick={onLogout} disabled={loggingOut}>
          {loggingOut ? <Spinner className="h-4 w-4" label="Signing out" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
          <span className="hidden sm:inline">Log out</span>
          <span className="sr-only sm:hidden">Log out</span>
        </Button>
      </div>
    </header>
  );
}
