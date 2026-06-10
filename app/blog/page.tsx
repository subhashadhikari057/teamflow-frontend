import Link from 'next/link';
import PageNav from '@/components/layout/PageNav';
import Footer from '@/components/landing/Footer';
import { BLOG_POSTS } from '@/lib/blog';

const TAG_COLORS: Record<string, string> = {
  Product:     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Engineering: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Design:      'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Culture:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Release:     'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

export default function BlogPage() {
  const [featured, ...rest] = BLOG_POSTS;

  return (
    <div className="min-h-screen bg-bg">
      <PageNav />

      <main className="mx-auto max-w-[1100px] px-6 py-20">
        {/* Header */}
        <div className="mb-14">
          <div className="text-[12px] uppercase tracking-[0.18em] text-muted font-medium mb-4">Blog</div>
          <h1 className="text-[clamp(32px,5vw,52px)] font-bold tracking-tightest text-ink leading-[1.05]">
            Stories from the team
          </h1>
          <p className="mt-4 text-[18px] text-sub max-w-[480px]">
            Product updates, engineering deep-dives, and how we think about building Teamflow.
          </p>
        </div>

        {/* Featured post */}
        <Link
          href={`/blog/${featured.slug}`}
          className="lift group block rounded-lg border border-line bg-panel p-8 mb-8 hover:border-[#555555] transition-colors"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${TAG_COLORS[featured.tag] ?? 'bg-elevated border-line text-sub'}`}>
              {featured.tag}
            </span>
            <span className="text-[12px] text-muted">{featured.date} · {featured.readTime}</span>
          </div>
          <h2 className="text-[26px] font-semibold tracking-tightest text-ink mb-3 group-hover:text-sub transition-colors">
            {featured.title}
          </h2>
          <p className="text-[15px] text-sub leading-[1.6] mb-6 max-w-[680px]">{featured.excerpt}</p>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
              style={{ background: featured.author.color }}
            >
              {featured.author.initials}
            </div>
            <div>
              <span className="text-[13px] font-medium text-ink">{featured.author.name}</span>
              <span className="text-[12px] text-muted ml-2">{featured.author.role}</span>
            </div>
          </div>
        </Link>

        {/* Post grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="lift group flex flex-col rounded-lg border border-line bg-panel p-6 hover:border-[#555555] transition-colors"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${TAG_COLORS[post.tag] ?? 'bg-elevated border-line text-sub'}`}>
                  {post.tag}
                </span>
              </div>
              <h3 className="text-[16px] font-semibold text-ink mb-2 leading-[1.3] group-hover:text-sub transition-colors flex-1">
                {post.title}
              </h3>
              <p className="text-[13px] text-sub leading-[1.5] mb-5 line-clamp-2">{post.excerpt}</p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-semibold text-white"
                    style={{ background: post.author.color }}
                  >
                    {post.author.initials}
                  </div>
                  <span className="text-[12px] text-sub">{post.author.name}</span>
                </div>
                <span className="text-[11px] text-muted">{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
