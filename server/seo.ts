import path from 'node:path';
import { db } from './db.ts';

interface SeoBookRow {
  id: number;
  title: string;
  slug: string;
  author: string;
  isbn: string;
  description: string;
  price: number;
  cover_path: string;
  pages: number;
  language: string;
  binding: string;
  publication_year: number;
  stock_quantity: number;
  is_available: number;
  category_name: string | null;
}

const DEFAULT_HERO_IMAGE = '/src/assets/images/hero_publishing_books_1794839640362.jpg';

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function truncateDescription(text: string, maxLen = 158): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  const sliced = cleaned.slice(0, maxLen - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

function getCoverPublicPath(coverPath: string): string {
  if (!coverPath) return DEFAULT_HERO_IMAGE;
  if (coverPath.startsWith('/src/assets/')) return coverPath;
  return `/api/media/covers/${encodeURIComponent(path.basename(coverPath))}`;
}

function getStoreMetaSettings(): { publisherName: string; currency: string } {
  const rows = db
    .prepare(`SELECT key, value FROM settings WHERE key IN ('publisher_name', 'currency')`)
    .all() as Array<{ key: string; value: string }>;
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    publisherName: map.publisher_name || 'Bhagwati Publications',
    currency: map.currency || 'INR',
  };
}

export function injectSeoIntoHtml(
  html: string,
  requestPath: string,
  origin: string
): string {
  const { publisherName, currency } = getStoreMetaSettings();
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = requestPath.split('?')[0] || '/';

  let title = publisherName;
  let description =
    'Explore verified editions, read sample PDFs, and order books directly from Bhagwati Publications—an independent publishing house.';
  let ogType = 'website';
  let canonicalUrl = `${cleanOrigin}${cleanPath}`;
  let imageUrl = `${cleanOrigin}${DEFAULT_HERO_IMAGE}`;
  let extraMetaTags = '';
  let jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: publisherName,
    url: cleanOrigin,
    logo: imageUrl,
    description,
    creator: {
      '@type': 'Organization',
      name: 'Global E-Auction',
      url: 'https://www.globaleauctions.in',
    },
  };

  const bookMatch = cleanPath.match(/^\/books\/([^/]+)\/?$/);
  if (bookMatch) {
    const slugOrId = decodeURIComponent(bookMatch[1]);
    const isNumeric = /^\d+$/.test(slugOrId);
    const book = db
      .prepare(
        `
        SELECT b.id, b.title, b.slug, b.author, b.isbn, b.description, b.price,
               b.cover_path, b.pages, b.language, b.binding, b.publication_year,
               b.stock_quantity, b.is_available, c.name as category_name
        FROM books b
        LEFT JOIN categories c ON c.id = b.category_id
        WHERE b.is_published = 1 AND ${isNumeric ? 'b.id = ?' : 'b.slug = ?'}
        `
      )
      .get(isNumeric ? Number(slugOrId) : slugOrId) as SeoBookRow | undefined;

    if (book) {
      title = `${book.title} by ${book.author} | ${publisherName}`;
      description = truncateDescription(
        `${book.description} Published by ${publisherName}. ISBN ${book.isbn}. Preview sample PDF or order online.`,
        158
      );
      ogType = 'book';
      canonicalUrl = `${cleanOrigin}/books/${book.slug}`;
      imageUrl = `${cleanOrigin}${getCoverPublicPath(book.cover_path)}`;
      const inStock = Boolean(book.is_available) && book.stock_quantity > 0;

      extraMetaTags = [
        `<meta property="book:author" content="${escapeHtmlAttr(book.author)}" />`,
        `<meta property="book:isbn" content="${escapeHtmlAttr(book.isbn)}" />`,
      ].join('\n    ');

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: book.title,
        author: {
          '@type': 'Person',
          name: book.author,
        },
        publisher: {
          '@type': 'Organization',
          name: publisherName,
        },
        isbn: book.isbn,
        bookFormat: book.binding.toLowerCase().includes('paper')
          ? 'https://schema.org/Paperback'
          : book.binding.toLowerCase().includes('digital')
            ? 'https://schema.org/EBook'
            : 'https://schema.org/Hardcover',
        numberOfPages: book.pages || undefined,
        inLanguage: book.language || 'English',
        datePublished: book.publication_year ? String(book.publication_year) : undefined,
        image: imageUrl,
        url: canonicalUrl,
        description,
        offers: {
          '@type': 'Offer',
          price: String(book.price),
          priceCurrency: currency,
          availability: inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: canonicalUrl,
        },
      };
    }
  } else if (cleanPath === '/catalog' || cleanPath === '/categories') {
    title = `Book Catalog | ${publisherName}`;
    description =
      'Browse the complete Bhagwati Publications book catalog by subject, author, or ISBN-13, preview sample PDFs, and order direct editions.';
  } else if (cleanPath === '/new-releases') {
    title = `New Releases | ${publisherName}`;
    description =
      'Discover new releases and recent hardcover and academic publications from Bhagwati Publications with sample PDF previews.';
  } else if (cleanPath === '/authors') {
    title = `Published Authors & Editors | ${publisherName}`;
    description =
      'Explore the authors, scholars, and editors published by Bhagwati Publications and browse their latest editions.';
  } else if (cleanPath.startsWith('/authors/')) {
    const authorSlug = decodeURIComponent(cleanPath.slice('/authors/'.length).replace(/\/+$/, ''));
    const authorRow = db
      .prepare(`SELECT name, credentials, affiliation, bio FROM authors WHERE slug = ?`)
      .get(authorSlug) as
      | { name: string; credentials: string; affiliation: string; bio: string }
      | undefined;
    if (authorRow) {
      title = `${authorRow.name} — Author Profile | ${publisherName}`;
      description = truncateDescription(
        authorRow.bio ||
          `Explore books, monographs, and verified editions by ${authorRow.name} published by ${publisherName}.`,
        158
      );
      canonicalUrl = `${cleanOrigin}/authors/${authorSlug}`;
    }
  } else if (cleanPath === '/updates' || cleanPath.startsWith('/updates/')) {
    title = `News & Publication Updates | ${publisherName}`;
    description =
      'Latest book releases, institutional course adoptions, and editorial announcements from Bhagwati Publications.';
  } else if (cleanPath === '/wishlist') {
    title = `My Wishlist | ${publisherName}`;
    description =
      'Review your saved favorite books from Bhagwati Publications, preview sample PDFs, and add titles to your shopping bag.';
  } else if (cleanPath === '/support' || cleanPath === '/track-order') {
    title = `Customer Support & Order Tracking | ${publisherName}`;
    description =
      'Contact Bhagwati Publications for book inquiries, institutional bulk orders, WhatsApp assistance, or live order status tracking.';
  }

  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtmlAttr(title)}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtmlAttr(description)}" />`
  );
  if (/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i.test(out)) {
    out = out.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />`
    );
  } else {
    extraMetaTags = [
      `<link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />`,
      extraMetaTags,
    ]
      .filter(Boolean)
      .join('\n    ');
  }
  out = out.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${escapeHtmlAttr(ogType)}" />`
  );
  out = out.replace(
    /<meta\s+property="og:site_name"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:site_name" content="${escapeHtmlAttr(publisherName)}" />`
  );
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtmlAttr(title)}" />`
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtmlAttr(description)}" />`
  );
  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}" />`
  );
  out = out.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${escapeHtmlAttr(imageUrl)}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtmlAttr(title)}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtmlAttr(description)}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${escapeHtmlAttr(imageUrl)}" />`
  );

  const injectedBlock = [
    extraMetaTags,
    `<script id="structured-data-jsonld" type="application/ld+json">${escapeJsonLd(jsonLd)}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');

  out = out.replace('</head>', `    ${injectedBlock}\n  </head>`);
  return out;
}

export function buildSitemapXml(origin: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const staticPaths = ['/', '/catalog', '/new-releases', '/authors', '/updates', '/support', '/track-order'];
  const books = db
    .prepare(`SELECT slug, updated_at FROM books WHERE is_published = 1 ORDER BY id DESC`)
    .all() as Array<{ slug: string; updated_at: string }>;
  const authors = db
    .prepare(`SELECT slug, updated_at FROM authors ORDER BY name ASC`)
    .all() as Array<{ slug: string; updated_at: string }>;

  const urls: string[] = staticPaths.map(
    (p) => `  <url><loc>${escapeHtmlAttr(`${cleanOrigin}${p}`)}</loc></url>`
  );

  for (const b of books) {
    const lastmod = b.updated_at ? b.updated_at.slice(0, 10) : '';
    urls.push(
      `  <url><loc>${escapeHtmlAttr(`${cleanOrigin}/books/${b.slug}`)}</loc>${
        lastmod ? `<lastmod>${lastmod}</lastmod>` : ''
      }</url>`
    );
  }

  for (const a of authors) {
    const lastmod = a.updated_at ? a.updated_at.slice(0, 10) : '';
    urls.push(
      `  <url><loc>${escapeHtmlAttr(`${cleanOrigin}/authors/${a.slug}`)}</loc>${
        lastmod ? `<lastmod>${lastmod}</lastmod>` : ''
      }</url>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
