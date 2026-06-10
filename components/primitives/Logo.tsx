interface LogoProps {
  size?: number;
  withWord?: boolean;
}

export default function Logo({ size = 24, withWord = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="22" height="22" rx="6" fill="#ffffff" />
        <path d="M7 16.5V7.5L12 12l5-4.5v9" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {withWord && (
        <span className="text-[17px] font-semibold tracking-tightest text-ink">Teamflow</span>
      )}
    </div>
  );
}
