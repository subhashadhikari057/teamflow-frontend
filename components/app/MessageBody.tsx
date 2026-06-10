import React from 'react';

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return tokens.map((tok, i) => {
    const k = `${keyPrefix}-${i}`;
    if (tok.startsWith('`') && tok.endsWith('`'))
      return (
        <code key={k} className="font-mono text-[12.5px] px-1.5 py-0.5 rounded bg-elevated border border-line text-[#e5e5e5]">
          {tok.slice(1, -1)}
        </code>
      );
    if (tok.startsWith('**') && tok.endsWith('**'))
      return <strong key={k} className="font-semibold text-ink">{tok.slice(2, -2)}</strong>;
    if (tok.startsWith('*') && tok.endsWith('*'))
      return <em key={k} className="italic text-[#cfcfcf]">{tok.slice(1, -1)}</em>;
    return <span key={k}>{tok}</span>;
  });
}

export default function MessageBody({ body }: { body: string }) {
  // split on fenced code blocks: ```lang\ncode```
  const parts = body.split(/```(\w*)\n([\s\S]*?)```/g);
  const out: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 0) {
      const chunk = parts[i];
      if (!chunk) continue;
      chunk.split('\n').forEach((line, li) => {
        out.push(
          <p key={`p-${i}-${li}`} className="text-[15px] leading-[1.5] text-[#d4d4d4]" style={{ margin: 0 }}>
            {line ? renderInline(line, `i-${i}-${li}`) : ' '}
          </p>,
        );
      });
    } else if (i % 3 === 2) {
      const lang = parts[i - 1];
      const code = parts[i].replace(/\n$/, '');
      out.push(
        <pre key={`c-${i}`} className="my-1.5 overflow-x-auto rounded-md bg-[#0a0a0a] border border-line p-3">
          {lang && (
            <div className="text-[10px] uppercase tracking-wider text-muted mb-1.5 font-mono">{lang}</div>
          )}
          <code className="font-mono text-[12.5px] leading-[1.6] text-[#d4d4d4] whitespace-pre">{code}</code>
        </pre>,
      );
    }
  }

  return <div className="space-y-0.5">{out}</div>;
}
