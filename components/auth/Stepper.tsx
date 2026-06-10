interface StepperProps {
  step: number;
  total?: number;
}

export default function Stepper({ step, total = 3 }: StepperProps) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8" role="progressbar" aria-valuenow={step + 1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1 rounded-full transition-all duration-300"
          style={{ width: i === step ? 28 : 16, background: i <= step ? '#fff' : '#333' }}
        />
      ))}
    </div>
  );
}
