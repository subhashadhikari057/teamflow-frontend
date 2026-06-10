interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function Field({ label, type = 'text', value, onChange, placeholder, autoFocus }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-ink mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full h-10 px-3 rounded-md bg-elevated border border-line text-[14px] text-ink placeholder:text-muted outline-none focus:border-[#555555] focus:ring-2 focus:ring-white/20 transition"
      />
    </label>
  );
}
