import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { INSTITUTION_NAME } from '../constants';
import { Logo } from './Logo';

export function Sidebar({ items, label = 'Learning portal', onNavigate, onClose, id }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-900 text-slate-100">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <Logo className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{INSTITUTION_NAME}</p>
          <p className="truncate text-xs text-slate-400">{label}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <nav id={id} aria-label="Primary" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end !== false}
                  onClick={onNavigate}
                  title={item.label}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
