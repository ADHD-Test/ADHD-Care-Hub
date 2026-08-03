import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const styles = {
    primary: 'bg-sage text-white hover:bg-[#356b61] disabled:bg-edge disabled:text-slate',
    secondary: 'bg-white text-ink border border-edge hover:border-sage',
    ghost: 'text-slate hover:text-ink',
  }[variant];

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
    />
  );
}

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`rounded-card bg-surface p-5 shadow-card ${className}`} />;
}

export function SectionHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-4">
      {eyebrow && <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-slate">{eyebrow}</p>}
      <h2 className="text-xl text-ink">{title}</h2>
      {children && <p className="mt-1 text-sm text-slate">{children}</p>}
    </header>
  );
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-edge px-5 py-8 text-center">
      <p className="text-sm text-slate">{title}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg bg-amber-soft px-3 py-2 text-sm text-[#8A5219]">
      {message}
    </p>
  );
}
