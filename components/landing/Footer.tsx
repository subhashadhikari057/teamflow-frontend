import Logo from '@/components/primitives/Logo';
import Icon from '@/components/primitives/Icon';

const FOOTER_COLS: Record<string, string[]> = {
  Product:   ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'],
  Company:   ['About', 'Blog', 'Careers', 'Press', 'Contact'],
  Resources: ['Docs', 'API Reference', 'Community', 'Status', 'Security'],
  Legal:     ['Privacy', 'Terms', 'Cookies', 'Licenses', 'DPA'],
};

export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto max-w-[1100px] px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 text-[13px] text-muted leading-[1.5] max-w-[200px]">
              Where your team&apos;s work actually happens.
            </p>
          </div>
          {Object.entries(FOOTER_COLS).map(([title, items]) => (
            <div key={title}>
              <div className="text-[13px] font-semibold text-ink mb-4">{title}</div>
              <ul className="space-y-2.5">
                {items.map((it) => (
                  <li key={it}>
                    <a href="#" className="text-[13px] text-sub hover:text-ink transition">
                      {it}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-6 border-t border-divider flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-muted">© 2026 Teamflow, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {(['globe', 'at', 'zap'] as const).map((ic) => (
              <a
                key={ic}
                href="#"
                aria-label={ic}
                className="w-8 h-8 rounded-md border border-divider flex items-center justify-center text-sub hover:text-ink hover:border-line transition"
              >
                <Icon name={ic} size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
