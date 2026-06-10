import { notFound } from 'next/navigation';
import Link from 'next/link';
import PageNav from '@/components/layout/PageNav';
import Footer from '@/components/landing/Footer';
import Icon from '@/components/primitives/Icon';
import { BLOG_POSTS, getBlogPost } from '@/lib/blog';

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

const TAG_COLORS: Record<string, string> = {
  Product:     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Engineering: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Design:      'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Culture:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Release:     'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

function renderBody(body: string) {
  const lines = body.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-[22px] font-semibold tracking-tightest text-ink mt-10 mb-4">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="my-5 overflow-x-auto rounded-md bg-[#0a0a0a] border border-line p-4">
          {lang && <div className="text-[10px] uppercase tracking-wider text-muted mb-2 font-mono">{lang}</div>}
          <code className="font-mono text-[13px] leading-[1.6] text-[#d4d4d4] whitespace-pre">
            {codeLines.join('\n')}
          </code>
        </pre>
      );
      i++;
      continue;
    }

    if (line === '') {
      elements.push(<div key={i} className="h-3" />);
      i++;
      continue;
    }

    const rendered = line
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="font-mono text-[13.5px] px-1.5 py-0.5 rounded bg-elevated border border-line text-[#e5e5e5]">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-ink underline underline-offset-2 hover:text-sub transition">$1</a>');

    elements.push(
      <p
        key={i}
        className="text-[16px] text-[#c8c8c8] leading-[1.75]"
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    );
    i++;
  }

  return elements;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const others = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-bg">
      <PageNav />

      <main className="mx-auto max-w-[720px] px-6 py-20">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-[13px] text-sub hover:text-ink transition mb-10">
          <Icon name="arrowright" size={13} className="rotate-180" />
          All posts
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${TAG_COLORS[post.tag] ?? 'bg-elevated border-line text-sub'}`}>
            {post.tag}
          </span>
          <span className="text-[12px] text-muted">{post.date} · {post.readTime}</span>
        </div>

        <h1 className="text-[clamp(28px,4vw,40px)] font-bold tracking-tightest text-ink leading-[1.1] mb-6">
          {post.title}
        </h1>

        <p className="text-[17px] text-sub leading-[1.6] mb-8 border-l-2 border-line pl-4">
          {post.excerpt}
        </p>

        {/* Author */}
        <div className="flex items-center gap-3 mb-12 pb-10 border-b border-divider">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center text-[13px] font-semibold text-white shrink-0"
            style={{ background: post.author.color }}
          >
            {post.author.initials}
          </div>
          <div>
            <div className="text-[14px] font-semibold text-ink">{post.author.name}</div>
            <div className="text-[12px] text-sub">{post.author.role}</div>
          </div>
        </div>

        {/* Body */}
        <article className="space-y-4">
          {renderBody(post.body)}
        </article>
      </main>

      {/* More posts */}
      {others.length > 0 && (
        <div className="border-t border-divider">
          <div className="mx-auto max-w-[1100px] px-6 py-16">
            <h2 className="text-[18px] font-semibold text-ink mb-6">More from the blog</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {others.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="lift group flex flex-col rounded-lg border border-line bg-panel p-5 hover:border-[#555555] transition-colors"
                >
                  <span className={`self-start text-[11px] font-medium px-2 py-0.5 rounded border mb-3 ${TAG_COLORS[p.tag] ?? 'bg-elevated border-line text-sub'}`}>
                    {p.tag}
                  </span>
                  <h3 className="text-[14px] font-semibold text-ink mb-1 group-hover:text-sub transition-colors leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-[12px] text-muted mt-auto pt-3">{p.date}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
