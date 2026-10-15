const VARIANTS = {
  primary:
    'border border-transparent bg-primary text-white hover:bg-primary-dark disabled:hover:bg-primary',
  secondary:
    'border border-line bg-white text-ink hover:bg-slate-50 disabled:hover:bg-white',
  danger:
    'border border-transparent bg-red-700 text-white hover:bg-red-800 disabled:hover:bg-red-700',
  ghost: 'border border-transparent bg-transparent text-ink-muted hover:bg-slate-100',
};

export function Button({
  type = 'button',
  variant = 'primary',
  icon = false,
  className = '',
  disabled = false,
  children,
  ...props
}) {
  const shape = icon ? 'h-10 w-10 rounded-full p-0' : 'min-h-10 rounded-lg px-4 py-2';
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${shape} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
