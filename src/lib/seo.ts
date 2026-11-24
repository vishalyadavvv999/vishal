import type { AuthorProfile, Book, StoreConfig } from '../types';
import type { AppView } from '../components/Navbar';

const DEFAULT_HERO_IMAGE = '/src/assets/images/hero_publishing_books_1794839640362.jpg';

function truncateDescription(text: string, maxLen = 158): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  const sliced = cleaned.slice(0, maxLen - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

function toAbsoluteUrl(urlOrPath: string): string {
  if (!urlOrPath) return window.location.origin;
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  const path = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${window.location.origin}${path}`;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(attr: 'name' | 'property', key: string): void {
  const el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (el) el.remove();
}

function upsertCanonical(href: string): void {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function upsertJsonLd(data: Record<string, unknown>): void {
  let script = document.getElementById('structured-data-jsonld') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'structured-data-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function applySeoMetadata(params: {
  view: AppView;
  book: Book | null;
  author?: AuthorProfile | null;
  storeConfig: StoreConfig;
}): void {
  const publisherName = params.storeConfig.publisher_name || 'Bhagwati Publications';
  const currentUrl = `${window.location.origin}${window.location.pathname}`;

  if (params.view === 'book' && params.book) {
    const book = params.book;
    const title = `${book.title} by ${book.author} | ${publisherName}`;
    const rawSummary = `${book.description} Published by ${publisherName}. ISBN ${book.isbn}. Preview sample PDF or order online.`;
    const description = truncateDescription(rawSummary, 158);
    const imageUrl = toAbsoluteUrl(book.cover_url || DEFAULT_HERO_IMAGE);
    const canonicalUrl = `${window.location.origin}/books/${book.slug}`;
    const inStock = book.is_available && book.stock_quantity > 0;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertCanonical(canonicalUrl);

    upsertMeta('property', 'og:type', 'book');
    upsertMeta('property', 'og:site_name', publisherName);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('property', 'book:author', book.author);
    upsertMeta('property', 'book:isbn', book.isbn);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', imageUrl);

    upsertJsonLd({
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
      bookFormat:
        book.binding.toLowerCase().includes('paper')
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
        priceCurrency: params.storeConfig.currency || 'INR',
        availability: inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: canonicalUrl,
      },
      ...((book.review_count || 0) > 0 && (book.average_rating || 0) > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: book.average_rating,
              reviewCount: book.review_count,
            },
          }
        : {}),
    });
    return;
  }

  // Non-book routes: clean up book-specific OG tags
  removeMeta('property', 'book:author');
  removeMeta('property', 'book:isbn');

  if (params.view === 'author' && params.author) {
    const author = params.author;
    const title = `${author.name} — Published Author | ${publisherName}`;
    const description = truncateDescription(
      author.bio ||
        `${author.name}${author.credentials ? ` (${author.credentials})` : ''} — published author at ${publisherName}.`,
      158
    );
    const canonicalUrl = `${window.location.origin}/authors/${author.slug}`;
    const heroImage = toAbsoluteUrl(DEFAULT_HERO_IMAGE);

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertCanonical(canonicalUrl);
    upsertMeta('property', 'og:type', 'profile');
    upsertMeta('property', 'og:site_name', publisherName);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', heroImage);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', heroImage);
    upsertJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: author.name,
      description,
      affiliation: author.affiliation
        ? { '@type': 'Organization', name: author.affiliation }
        : undefined,
      url: canonicalUrl,
    });
    return;
  }

  let pageTitle = publisherName;
  let pageDesc =
    'Explore verified editions, read sample PDFs, and order books directly from Bhagwati Publications—an independent publishing house.';

  if (params.view === 'catalog') {
    pageTitle = `Book Catalog | ${publisherName}`;
    pageDesc =
      'Browse the complete Bhagwati Publications book catalog by subject, author, or ISBN-13, preview sample PDFs, and order direct editions.';
  } else if (params.view === 'categories') {
    pageTitle = `Browse by Category | ${publisherName}`;
    pageDesc =
      'Explore Bhagwati Publications books organized by academic, architectural, business, and literary subject categories.';
  } else if (params.view === 'new-arrivals') {
    pageTitle = `New Releases | ${publisherName}`;
    pageDesc =
      'Discover new releases and recent hardcover and academic publications from Bhagwati Publications with sample PDF previews.';
  } else if (params.view === 'authors' || params.view === 'author') {
    pageTitle = `Published Authors & Editors | ${publisherName}`;
    pageDesc =
      'Explore the authors, scholars, and editors published by Bhagwati Publications and browse their latest editions.';
  } else if (params.view === 'updates') {
    pageTitle = `News & Publication Updates | ${publisherName}`;
    pageDesc =
      'Official publishing announcements, new print releases, and academic press dispatches from Bhagwati Publications.';
  } else if (params.view === 'about') {
    pageTitle = `About Us & Leadership | ${publisherName}`;
    pageDesc =
      'Learn about Bhagwati Publications, our editorial publishing standards, and our Director & Managing Head Dr. S.B. Saraswat.';
  } else if (params.view === 'wishlist') {
    pageTitle = `My Wishlist | ${publisherName}`;
    pageDesc =
      'Review your saved favorite books from Bhagwati Publications, preview sample PDFs, and add titles to your shopping bag.';
  } else if (params.view === 'support') {
    pageTitle = `Customer Support & Order Tracking | ${publisherName}`;
    pageDesc =
      'Contact Bhagwati Publications for book inquiries, institutional bulk orders, WhatsApp assistance, or live order status tracking.';
  } else if (params.view === 'admin') {
    pageTitle = `Owner Admin Portal | ${publisherName}`;
    pageDesc = `Publisher management portal for ${publisherName}.`;
  }

  const heroImage = toAbsoluteUrl(DEFAULT_HERO_IMAGE);

  document.title = pageTitle;
  upsertMeta('name', 'description', pageDesc);
  upsertCanonical(currentUrl);

  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:site_name', publisherName);
  upsertMeta('property', 'og:title', pageTitle);
  upsertMeta('property', 'og:description', pageDesc);
  upsertMeta('property', 'og:url', currentUrl);
  upsertMeta('property', 'og:image', heroImage);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', pageTitle);
  upsertMeta('name', 'twitter:description', pageDesc);
  upsertMeta('name', 'twitter:image', heroImage);

  upsertJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: publisherName,
    url: window.location.origin,
    logo: heroImage,
    description: pageDesc,
    creator: {
      '@type': 'Organization',
      name: 'Global E-Auction',
      url: 'https://www.globaleauctions.in',
    },
  });
}
