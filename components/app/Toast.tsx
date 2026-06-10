import Icon from '@/components/primitives/Icon';

export default function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] anim-slide">
      <div className="flex items-center gap-2.5 px-4 h-10 rounded-md bg-elevated border border-line text-[13px] text-ink shadow-lg">
        <Icon name="command" size={14} className="text-sub" />
        {msg}
      </div>
    </div>
  );
}
