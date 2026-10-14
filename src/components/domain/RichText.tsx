import type { ComponentProps } from 'react';
import { useTranslations } from 'next-intl';
import Markdown, { type Components } from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

// Lesson text is written by course authors and read by children: no raw HTML, and no element
// that makes the browser fetch from a host the author chose. Images go through the `image`
// block (MediaImage), so `img` is not an allowed element here.
const BANNED_TAGS = ['img', 'picture', 'source'];
const SCHEMA = {
  ...defaultSchema,
  tagNames: (defaultSchema.tagNames ?? []).filter((tag) => !BANNED_TAGS.includes(tag)),
  protocols: { ...defaultSchema.protocols, href: ['http', 'https', 'mailto'] },
};

const OUTBOUND = /^(?:https?:|mailto:)/i;

// A fragment stays on the page (footnotes). Everything else that is not an absolute http(s) or
// mailto URL, a relative path included, loses its href and renders as plain text.
function urlTransform(url: string): string {
  return OUTBOUND.test(url) || url.startsWith('#') ? url : '';
}

const LINK = 'font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800';

// Only the attributes named here reach the DOM; react-markdown also passes its syntax node.
function RichTextLink({
  href,
  children,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: ComponentProps<'a'>) {
  const t = useTranslations('domain');
  if (!href) return <span>{children}</span>;
  if (href.startsWith('#')) {
    return (
      <a
        href={href}
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className={LINK}
      >
        {children}
      </a>
    );
  }
  const newTab = !href.toLowerCase().startsWith('mailto:');
  return (
    <a
      href={href}
      className={LINK}
      {...(newTab ? { target: '_blank' } : null)}
      rel="noopener noreferrer"
    >
      {children}
      {newTab && <span className="sr-only"> ({t('richText.externalLink')})</span>}
    </a>
  );
}

// A wide table scrolls inside its own box instead of widening the page.
function RichTextTable({ children }: ComponentProps<'table'>) {
  return (
    <div className="my-[1em] overflow-x-auto">
      <table className="w-full border-collapse text-start text-[0.95em]">{children}</table>
    </div>
  );
}

// The page owns h1 and the block its own heading, so Markdown headings start at h3.
const COMPONENTS: Components = {
  h1: 'h3',
  h2: 'h3',
  h3: 'h4',
  h4: 'h5',
  h5: 'h5',
  h6: 'h5',
  a: RichTextLink,
  table: RichTextTable,
};

// Sizes are in em, so the same rules serve lesson text and the smaller chat text.
const PROSE = cn(
  'min-w-0 break-words text-ink',
  '[&_p]:my-[0.75em] [&>:first-child]:mt-0 [&>:last-child]:mb-0',
  '[&_h3]:mt-[1.4em] [&_h3]:mb-[0.5em] [&_h3]:text-[1.25em] [&_h3]:leading-snug [&_h3]:font-semibold',
  '[&_h4]:mt-[1.3em] [&_h4]:mb-[0.4em] [&_h4]:text-[1.1em] [&_h4]:leading-snug [&_h4]:font-semibold',
  '[&_h5]:mt-[1.2em] [&_h5]:mb-[0.4em] [&_h5]:font-semibold',
  '[&_ol]:my-[0.75em] [&_ol]:list-decimal [&_ol]:ps-[1.5em] [&_ul]:my-[0.75em] [&_ul]:list-disc [&_ul]:ps-[1.5em]',
  '[&_li]:my-[0.25em] [&_li::marker]:text-ink-muted [&_li>p]:my-0',
  '[&_input]:me-2 [&_ul.contains-task-list]:list-none [&_ul.contains-task-list]:ps-0',
  '[&_blockquote]:my-[1em] [&_blockquote]:border-s-4 [&_blockquote]:border-brand-200 [&_blockquote]:ps-4 [&_blockquote]:text-ink-muted',
  '[&_code]:rounded-sm [&_code]:bg-surface-muted [&_code]:px-[0.3em] [&_code]:py-[0.1em] [&_code]:font-mono [&_code]:text-[0.9em]',
  '[&_pre]:my-[1em] [&_pre]:overflow-x-auto [&_pre]:rounded-control [&_pre]:bg-ink [&_pre]:p-4 [&_pre]:text-[0.9em] [&_pre]:leading-relaxed [&_pre]:text-white',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[1em]',
  '[&_hr]:my-[1.5em] [&_hr]:border-border',
  '[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2',
  '[&_th]:border [&_th]:border-border [&_th]:bg-surface-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-start [&_th]:font-semibold',
  // What is left of a paragraph whose only content was an image.
  '[&_p:empty]:hidden',
  '[&_strong]:font-semibold',
);

const SIZES = { sm: 'text-sm leading-relaxed', md: 'text-base leading-relaxed' } as const;

export interface RichTextProps {
  markdown: string;
  /** `sm` is for chat bubbles and other dense places. */
  size?: keyof typeof SIZES;
  className?: string;
}

/** Markdown (GFM) with no raw HTML and no images; links open in a new tab. */
export function RichText({ markdown, size = 'md', className }: RichTextProps) {
  return (
    <div className={cn(PROSE, SIZES[size], className)}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, SCHEMA]]}
        components={COMPONENTS}
        disallowedElements={BANNED_TAGS}
        urlTransform={urlTransform}
        skipHtml
      >
        {markdown}
      </Markdown>
    </div>
  );
}
