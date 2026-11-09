import { Link } from 'react-router-dom';
import { cn } from '../ui';

export default function Logo({ className, compact, to = '/dashboard' }) {
  return (
    <Link to={to} className={cn('group flex items-center gap-2.5', className)} aria-label="Wealthify home">
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden>
        <rect x="2" y="2" width="60" height="60" rx="4" fill="#030705" stroke="#39ff95" strokeOpacity="0.5" strokeWidth="2" />
        <path d="M14 22l8 22 10-16 10 16 8-22" fill="none" stroke="#39ff95" strokeWidth="5" strokeLinejoin="miter" style={{ filter: 'drop-shadow(0 0 4px #39ff95)' }} />
      </svg>
      {!compact && (
        <span className="text-[16px] font-extrabold tracking-tight text-ink-50">
          wealthify<span className="text-neon">_</span>
        </span>
      )}
    </Link>
  );
}
