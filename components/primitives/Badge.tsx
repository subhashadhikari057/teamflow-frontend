interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-elevated border border-line text-sub ${className}`}>
      {children}
    </span>
  );
}
