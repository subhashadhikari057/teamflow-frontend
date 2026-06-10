import { USERS } from '@/lib/data';

interface AvatarProps {
  userId: string;
  size?: number;
  presence?: boolean;
  ring?: boolean;
}

export default function Avatar({ userId, size = 36, presence, ring = false }: AvatarProps) {
  const u = USERS[userId];
  if (!u) return null;

  const showDot = presence !== false ? u.presence : null;
  const dotColor = showDot === 'online' ? '#22c55e' : showDot === 'away' ? '#eab308' : '#555555';
  const dotSize = Math.max(8, Math.round(size * 0.28));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="w-full h-full flex items-center justify-center font-semibold text-white select-none"
        style={{
          background: u.color,
          borderRadius: size > 28 ? 8 : 6,
          fontSize: size * 0.4,
          letterSpacing: '-0.02em',
          boxShadow: ring ? '0 0 0 2px #000' : 'none',
        }}
      >
        {u.initials}
      </div>
      {showDot && (
        <span
          className="absolute rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            right: -2,
            bottom: -2,
            background: dotColor,
            border: '2px solid #0a0a0a',
            boxShadow: showDot === 'online' ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
          }}
        />
      )}
    </div>
  );
}
