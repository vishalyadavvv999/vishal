import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import {
  ADMIN_COOKIE_NAME,
  CUSTOMER_COOKIE_NAME,
  hashPassword,
  requireAdmin,
  requireCustomer,
  signSessionToken,
  verifyPassword,
  type AuthenticatedRequest,
} from './server/auth.ts';
import { db, initializeDatabase, slugify, syncAuthorsFromBooks } from './server/db.ts';
import {
  bookUpload,
  COVERS_DIR,
  deleteStoredFile,
  leadershipPhotoUpload,
  PRIVATE_PDFS_DIR,
  resolveSafeFilePath,
  SAMPLE_PDFS_DIR,
} from './server/uploads.ts';
import { buildSitemapXml, injectSeoIntoHtml } from './server/seo.ts';

initializeDatabase();

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Respect reverse-proxy headers (Nginx, Cloudflare, Railway, Render, Fly.io) for custom domains
app.set('trust proxy', 1);

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

function isHttpsRequest(req: Request): boolean {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  return req.secure || forwardedProto === 'https';
}

interface BookRow {
  id: number;
  title: string;
  slug: string;
  author: string;
  isbn: string;
  description: string;
  price: number;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  cover_path: string;
  sample_pdf_path: string;
  private_pdf_path: string;
  pages: number;
  language: string;
  binding: string;
  publication_year: number;
  stock_quantity: number;
  is_available: number;
  is_featured: number;
  is_new_arrival: number;
  is_published: number;
  created_at: string;
  updated_at: string;
  author_slug?: string | null;
  average_rating?: number;
  review_count?: number;
}

function getCoverUrl(coverPath: string): string {
  if (!coverPath) return '';
  if (coverPath.startsWith('/src/assets/')) return coverPath;
  return `/api/media/covers/${encodeURIComponent(path.basename(coverPath))}`;
}

function serializePublicBook(row: BookRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    author: row.author,
    author_slug: row.author_slug || slugify(row.author),
    isbn: row.isbn,
    description: row.description,
    price: row.price,
    category_id: row.category_id,
    category_name: row.category_name || 'General',
    category_slug: row.category_slug || 'general',
    cover_url: getCoverUrl(row.cover_path),
    has_sample_pdf: Boolean(row.sample_pdf_path),
    pages: row.pages,
    language: row.language,
    binding: row.binding,
    publication_year: row.publication_year,
    stock_quantity: row.stock_quantity,
    is_available: Boolean(row.is_available),
    is_featured: Boolean(row.is_featured),
    is_new_arrival: Boolean(row.is_new_arrival),
    is_published: Boolean(row.is_published),
    average_rating: Number(row.average_rating || 0),
    review_count: Number(row.review_count || 0),
    created_at: row.created_at,
  };
}

function serializeAdminBook(row: BookRow) {
  return {
    ...serializePublicBook(row),
    has_private_pdf: Boolean(row.private_pdf_path),
    updated_at: row.updated_at,
  };
}

function getSettingsMap(): Record<string, string> {
  const rows = db.prepare(`SELECT key, value FROM settings`).all() as Array<{
    key: string;
    value: string;
  }>;
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}

function getPublicStoreConfig() {
  const s = getSettingsMap();
  return {
    publisher_name: s.publisher_name || 'Bhagwati Publications',
    support_email: s.support_email || '',
    support_phone: s.support_phone || '',
    whatsapp_number: s.whatsapp_number || '',
    business_address: s.business_address || '',
    currency: s.currency || 'INR',
    free_shipping_threshold: Number(s.free_shipping_threshold ?? 999),
    standard_shipping_fee: Number(s.standard_shipping_fee ?? 60),
    payment_cod_enabled: s.payment_cod_enabled !== 'false',
    payment_upi_enabled: s.payment_upi_enabled === 'true',
    payment_upi_id: s.payment_upi_id || '',
    payment_gateway_provider: s.payment_gateway_provider || 'none',
    payment_gateway_public_key: s.payment_gateway_public_key || '',
    payment_gateway_mode: s.payment_gateway_mode === 'live' ? 'live' : 'test',
    founder_name: s.founder_name || 'Dr. S.B. Saraswat',
    founder_designation:
      s.founder_designation || 'Director & Managing Head · Bhagwati Publications',
    founder_credentials:
      s.founder_credentials ||
      'Ph.D. · B.E. (Electrical & Industrial Engineering) · PG in ADR, Public Administration & Materials Management · ISO-9000 & High-Tension Electrical Certified',
    founder_bio:
      s.founder_bio ||
      'Dr. S.B. Saraswat brings decades of international industrial leadership, institutional governance, and technical scholarship to Bhagwati Publications. He serves as Resident Director at Danieli Corus (Netherlands) and previously held senior executive appointments as Joint Director (Technical/Materials) at Steel Authority of India Limited (SAIL) and Director of Supply Chain Management at Global Steel Sofia (Europe).\n\nUnder his editorial stewardship, Bhagwati Publications advances rigorous academic, engineering, heritage, and management publishing for scholars, universities, and professional libraries.',
    founder_photo_url: s.founder_photo_url || '',
  };
}

function generateUniqueBookSlug(title: string, excludeId?: number): string {
  const base = slugify(title);
  let candidate = base;
  let counter = 1;
  while (true) {
    const existing = excludeId
      ? (db.prepare(`SELECT id FROM books WHERE slug = ? AND id != ?`).get(candidate, excludeId) as
          | { id: number }
          | undefined)
      : (db.prepare(`SELECT id FROM books WHERE slug = ?`).get(candidate) as
          | { id: number }
          | undefined);
    if (!existing) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

function generateUniqueCategorySlug(name: string, excludeId?: number): string {
  const base = slugify(name);
  let candidate = base;
  let counter = 1;
  while (true) {
    const existing = excludeId
      ? (db
          .prepare(`SELECT id FROM categories WHERE slug = ? AND id != ?`)
          .get(candidate, excludeId) as { id: number } | undefined)
      : (db.prepare(`SELECT id FROM categories WHERE slug = ?`).get(candidate) as
          | { id: number }
          | undefined);
    if (!existing) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

function generateUniqueUpdateSlug(title: string, excludeId?: number): string {
  const base = slugify(title);
  let candidate = base;
  let counter = 1;
  while (true) {
    const existing = excludeId
      ? (db
          .prepare(`SELECT id FROM publication_updates WHERE slug = ? AND id != ?`)
          .get(candidate, excludeId) as { id: number } | undefined)
      : (db.prepare(`SELECT id FROM publication_updates WHERE slug = ?`).get(candidate) as
          | { id: number }
          | undefined);
    if (!existing) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

function extractReadablePdfLines(filePath: string): string[] {
  try {
    const raw = fs.readFileSync(filePath, 'latin1');
    const matches = raw.match(/\(([^()]{3,160})\)\s*Tj/g);
    if (!matches || matches.length === 0) return [];
    const lines: string[] = [];
    for (const m of matches) {
      const inner = m
        .replace(/^\(/, '')
        .replace(/\)\s*Tj$/, '')
        .replace(/\\([()\\])/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
      if (inner && !/^BHAGWATI PUBLICATIONS/i.test(inner)) {
        lines.push(inner);
      }
    }
    return lines.slice(0, 60);
  } catch {
    return [];
  }
}

function hydrateOrder(orderId: number) {
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId) as
    | Record<string, unknown>
    | undefined;
  if (!order) return null;
  const items = db
    .prepare(`SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC`)
    .all(orderId);
  return { ...order, items };
}

// ============================================================================
// PUBLIC API ROUTES
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/store/config', (_req, res) => {
  res.json(getPublicStoreConfig());
});

app.get('/api/categories', (_req, res) => {
  const rows = db
    .prepare(
      `
      SELECT c.id, c.name, c.slug, c.description,
             COUNT(CASE WHEN b.is_published = 1 THEN 1 END) as book_count
      FROM categories c
      LEFT JOIN books b ON b.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
      `
    )
    .all();
  res.json(rows);
});

app.get('/api/books', (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const language = typeof req.query.language === 'string' ? req.query.language.trim().toLowerCase() : '';
  const binding = typeof req.query.binding === 'string' ? req.query.binding.trim().toLowerCase() : '';
  const author = typeof req.query.author === 'string' ? req.query.author.trim().toLowerCase() : '';
  const minPrice = req.query.min_price !== undefined && req.query.min_price !== '' ? Number(req.query.min_price) : null;
  const maxPrice = req.query.max_price !== undefined && req.query.max_price !== '' ? Number(req.query.max_price) : null;
  const inStockOnly = req.query.in_stock === 'true';
  const featured = req.query.featured === 'true';
  const newArrival = req.query.new_arrival === 'true';
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'newest';

  const conditions: string[] = ['b.is_published = 1'];
  const params: Array<string | number> = [];

  if (category && category !== 'all') {
    conditions.push('c.slug = ?');
    params.push(category);
  }
  if (language && language !== 'all') {
    conditions.push('LOWER(b.language) = ?');
    params.push(language);
  }
  if (binding && binding !== 'all') {
    conditions.push('LOWER(b.binding) = ?');
    params.push(binding);
  }
  if (author && author !== 'all') {
    conditions.push('LOWER(b.author) = ?');
    params.push(author);
  }
  if (minPrice !== null && Number.isFinite(minPrice)) {
    conditions.push('b.price >= ?');
    params.push(minPrice);
  }
  if (maxPrice !== null && Number.isFinite(maxPrice)) {
    conditions.push('b.price <= ?');
    params.push(maxPrice);
  }
  if (inStockOnly) {
    conditions.push('b.is_available = 1 AND b.stock_quantity > 0');
  }
  if (featured) {
    conditions.push('b.is_featured = 1');
  }
  if (newArrival) {
    conditions.push('b.is_new_arrival = 1');
  }
  if (search) {
    conditions.push(
      `(LOWER(b.title) LIKE ? OR LOWER(b.author) LIKE ? OR LOWER(b.isbn) LIKE ? OR LOWER(b.description) LIKE ? OR LOWER(COALESCE(c.name, '')) LIKE ?)`
    );
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern, pattern, pattern);
  }

  let orderBy = 'b.created_at DESC, b.id DESC';
  if (sort === 'price_asc') orderBy = 'b.price ASC';
  else if (sort === 'price_desc') orderBy = 'b.price DESC';
  else if (sort === 'title') orderBy = 'b.title ASC';
  else if (sort === 'rating') orderBy = 'average_rating DESC, review_count DESC, b.created_at DESC';

  const sql = `
    SELECT b.*, c.name as category_name, c.slug as category_slug,
           a.slug as author_slug,
           COALESCE(ROUND(AVG(br.rating), 1), 0) as average_rating,
           COUNT(br.id) as review_count
    FROM books b
    LEFT JOIN categories c ON c.id = b.category_id
    LEFT JOIN authors a ON LOWER(a.name) = LOWER(TRIM(b.author))
    LEFT JOIN book_reviews br ON br.book_id = b.id
    WHERE ${conditions.join(' AND ')}
    GROUP BY b.id
    ORDER BY ${orderBy}
  `;

  const rows = db.prepare(sql).all(...params) as BookRow[];
  res.json(rows.map(serializePublicBook));
});

app.get('/api/books/:idOrSlug', (req, res) => {
  const param = req.params.idOrSlug;
  const isNumeric = /^\d+$/.test(param);
  const row = db
    .prepare(
      `
      SELECT b.*, c.name as category_name, c.slug as category_slug,
             a.slug as author_slug,
             COALESCE(ROUND(AVG(br.rating), 1), 0) as average_rating,
             COUNT(br.id) as review_count
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      LEFT JOIN authors a ON LOWER(a.name) = LOWER(TRIM(b.author))
      LEFT JOIN book_reviews br ON br.book_id = b.id
      WHERE b.is_published = 1 AND ${isNumeric ? 'b.id = ?' : 'b.slug = ?'}
      GROUP BY b.id
      `
    )
    .get(isNumeric ? Number(param) : param) as BookRow | undefined;

  if (!row) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  res.json(serializePublicBook(row));
});

// Interactive Digital Preview Pages for a Book
app.get('/api/books/:id/preview-excerpt', (req, res) => {
  const bookId = Number(req.params.id);
  if (!Number.isInteger(bookId)) {
    res.status(400).json({ error: 'Invalid book ID' });
    return;
  }

  const book = db
    .prepare(
      `
      SELECT b.*, c.name as category_name, c.slug as category_slug
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      WHERE b.id = ? AND b.is_published = 1
      `
    )
    .get(bookId) as BookRow | undefined;

  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  let extractedPdfLines: string[] = [];
  if (book.sample_pdf_path) {
    const safePath = resolveSafeFilePath(SAMPLE_PDFS_DIR, book.sample_pdf_path);
    if (safePath && fs.existsSync(safePath)) {
      extractedPdfLines = extractReadablePdfLines(safePath);
    }
  }

  const chapterLines = extractedPdfLines.filter(
    (line) =>
      line !== book.title &&
      !line.startsWith(`By ${book.author}`) &&
      !line.startsWith('Category:') &&
      line !== 'Publisher Synopsis' &&
      !line.startsWith('Note: This is a public sample')
  );

  const pages = [
    {
      page_number: 1,
      chapter_title: 'Title & Edition Sheet',
      kind: 'title',
      paragraphs: [
        `${book.title}`,
        `Written / Edited by ${book.author}`,
        `Subject: ${book.category_name || 'General'} · Language: ${book.language || 'English'} · Binding: ${book.binding || 'Hardcover'}`,
        `ISBN-13: ${book.isbn} · Published: ${book.publication_year || 'Current Edition'}${book.pages ? ` · Extent: ${book.pages} pages` : ''}`,
        'Published by Bhagwati Publications. Official Digital Sample Edition Preview.',
      ],
    },
    {
      page_number: 2,
      chapter_title: 'Editorial Synopsis',
      kind: 'synopsis',
      paragraphs: book.description
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean),
    },
    {
      page_number: 3,
      chapter_title: 'Sample Reading Excerpt',
      kind: 'excerpt',
      paragraphs:
        chapterLines.length > 0
          ? [chapterLines.join(' ')]
          : [
              `Readers exploring "${book.title}" will find carefully verified editorial structure, bibliographic citations, and crisp layout prepared for academic libraries and dedicated readers.`,
              'For complete chapter distribution, institutional inspection copies, or classroom adoption inquiries, connect directly with Bhagwati Publications via our Customer Support desk or WhatsApp inquiry channel.',
            ],
    },
  ];

  res.json({
    book_id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    has_sample_pdf: Boolean(book.sample_pdf_path),
    pages,
  });
});

// Public Author Directory & Author Profile Routes
app.get('/api/authors', (_req, res) => {
  syncAuthorsFromBooks();
  const authors = db
    .prepare(`SELECT id, name, slug, credentials, affiliation, location, bio, created_at FROM authors ORDER BY name ASC`)
    .all() as Array<{
    id: number;
    name: string;
    slug: string;
    credentials: string;
    affiliation: string;
    location: string;
    bio: string;
    created_at: string;
  }>;

  const bookStmt = db.prepare(`
    SELECT b.id, b.title, b.slug, b.language, b.publication_year, c.name as category_name
    FROM books b
    LEFT JOIN categories c ON c.id = b.category_id
    WHERE b.is_published = 1 AND LOWER(TRIM(b.author)) = LOWER(?)
    ORDER BY b.publication_year DESC, b.id DESC
  `);

  const payload = authors
    .map((a) => {
      const books = bookStmt.all(a.name) as Array<{
        id: number;
        title: string;
        slug: string;
        language: string;
        publication_year: number;
        category_name: string | null;
      }>;
      const subjects = Array.from(
        new Set(books.map((b) => b.category_name).filter((x): x is string => Boolean(x)))
      );
      const languages = Array.from(
        new Set(books.map((b) => b.language).filter((x): x is string => Boolean(x)))
      );
      return {
        ...a,
        book_count: books.length,
        subjects,
        languages,
        featured_title: books[0]?.title || '',
      };
    })
    .filter((a) => a.book_count > 0);

  res.json(payload);
});

app.get('/api/authors/:slug', (req, res) => {
  syncAuthorsFromBooks();
  const author = db
    .prepare(`SELECT id, name, slug, credentials, affiliation, location, bio, created_at FROM authors WHERE slug = ?`)
    .get(req.params.slug) as
    | {
        id: number;
        name: string;
        slug: string;
        credentials: string;
        affiliation: string;
        location: string;
        bio: string;
        created_at: string;
      }
    | undefined;

  if (!author) {
    res.status(404).json({ error: 'Author profile not found' });
    return;
  }

  const books = db
    .prepare(
      `
      SELECT b.*, c.name as category_name, c.slug as category_slug,
             ? as author_slug,
             COALESCE(ROUND(AVG(br.rating), 1), 0) as average_rating,
             COUNT(br.id) as review_count
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      LEFT JOIN book_reviews br ON br.book_id = b.id
      WHERE b.is_published = 1 AND LOWER(TRIM(b.author)) = LOWER(?)
      GROUP BY b.id
      ORDER BY b.publication_year DESC, b.id DESC
      `
    )
    .all(author.slug, author.name) as BookRow[];

  const serializedBooks = books.map(serializePublicBook);
  const subjects = Array.from(
    new Set(serializedBooks.map((b) => b.category_name).filter(Boolean))
  );
  const languages = Array.from(
    new Set(serializedBooks.map((b) => b.language).filter(Boolean))
  );

  res.json({
    author: {
      ...author,
      book_count: serializedBooks.length,
      subjects,
      languages,
      featured_title: serializedBooks[0]?.title || '',
    },
    books: serializedBooks,
  });
});

// Public News & Publication Updates
app.get('/api/updates', (_req, res) => {
  const rows = db
    .prepare(
      `
      SELECT u.*, b.title as related_book_title, b.slug as related_book_slug
      FROM publication_updates u
      LEFT JOIN books b ON b.id = u.related_book_id AND b.is_published = 1
      WHERE u.is_published = 1
      ORDER BY u.published_at DESC, u.id DESC
      `
    )
    .all() as Array<Record<string, unknown>>;

  res.json(
    rows.map((r) => ({
      ...r,
      is_published: Boolean(r.is_published),
    }))
  );
});

// Serve uploaded cover images securely from COVERS_DIR
app.get('/api/media/covers/:filename', (req, res) => {
  const safePath = resolveSafeFilePath(COVERS_DIR, req.params.filename);
  if (!safePath || !fs.existsSync(safePath)) {
    res.status(404).json({ error: 'Cover image not found' });
    return;
  }
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(safePath);
});

// Stream ONLY public sample preview PDFs (never exposes private_pdf_path!)
app.get('/api/books/:id/sample-pdf', (req, res) => {
  const bookId = Number(req.params.id);
  if (!Number.isInteger(bookId)) {
    res.status(400).json({ error: 'Invalid book ID' });
    return;
  }

  const row = db
    .prepare(`SELECT title, sample_pdf_path, is_published FROM books WHERE id = ?`)
    .get(bookId) as
    | { title: string; sample_pdf_path: string; is_published: number }
    | undefined;

  if (!row || !row.is_published || !row.sample_pdf_path) {
    res.status(404).json({ error: 'Sample preview PDF not available for this edition' });
    return;
  }

  const safePath = resolveSafeFilePath(SAMPLE_PDFS_DIR, row.sample_pdf_path);
  if (!safePath || !fs.existsSync(safePath)) {
    res.status(404).json({ error: 'Sample PDF file not found' });
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${slugify(row.title)}-sample.pdf"`
  );
  res.sendFile(safePath);
});

// Authoritative server-side Order Creation
app.post('/api/orders', (req, res) => {
  const body = req.body as {
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    shipping_address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    payment_method?: string;
    payment_reference?: string;
    notes?: string;
    items?: Array<{ book_id: number; quantity: number }>;
  };

  if (
    !body.customer_name?.trim() ||
    !body.customer_email?.trim() ||
    !body.customer_phone?.trim() ||
    !body.shipping_address?.trim() ||
    !body.city?.trim() ||
    !body.state?.trim() ||
    !body.postal_code?.trim() ||
    !Array.isArray(body.items) ||
    body.items.length === 0
  ) {
    res.status(400).json({ error: 'Please complete all required shipping fields and cart items.' });
    return;
  }

  const store = getPublicStoreConfig();

  const createTx = db.transaction(() => {
    let subtotal = 0;
    const preparedItems: Array<{
      book_id: number;
      book_title: string;
      book_isbn: string;
      unit_price: number;
      quantity: number;
      line_total: number;
    }> = [];

    for (const reqItem of body.items || []) {
      const qty = Math.floor(Number(reqItem.quantity));
      if (!Number.isInteger(reqItem.book_id) || qty <= 0) {
        throw new Error('Invalid cart item quantity');
      }

      const book = db
        .prepare(
          `SELECT id, title, isbn, price, stock_quantity, is_available, is_published FROM books WHERE id = ?`
        )
        .get(reqItem.book_id) as
        | {
            id: number;
            title: string;
            isbn: string;
            price: number;
            stock_quantity: number;
            is_available: number;
            is_published: number;
          }
        | undefined;

      if (!book || !book.is_published || !book.is_available) {
        throw new Error(`Book is no longer available for purchase.`);
      }

      if (book.stock_quantity < qty) {
        throw new Error(
          `Insufficient stock for "${book.title}". Available: ${book.stock_quantity}`
        );
      }

      const lineTotal = Number((book.price * qty).toFixed(2));
      subtotal += lineTotal;
      preparedItems.push({
        book_id: book.id,
        book_title: book.title,
        book_isbn: book.isbn,
        unit_price: book.price,
        quantity: qty,
        line_total: lineTotal,
      });

      const nextStock = book.stock_quantity - qty;
      db.prepare(
        `UPDATE books SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(nextStock, book.id);
    }

    const shippingFee =
      store.free_shipping_threshold > 0 && subtotal >= store.free_shipping_threshold
        ? 0
        : store.standard_shipping_fee;
    const totalAmount = Number((subtotal + shippingFee).toFixed(2));

    const orderNumber = `BP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const info = db
      .prepare(
        `
        INSERT INTO orders (
          order_number, customer_name, customer_email, customer_phone,
          shipping_address, city, state, postal_code,
          payment_method, payment_status, payment_reference,
          order_status, subtotal, shipping_fee, total_amount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'pending', ?, ?, ?, ?)
        `
      )
      .run(
        orderNumber,
        body.customer_name!.trim(),
        body.customer_email!.trim().toLowerCase(),
        body.customer_phone!.trim(),
        body.shipping_address!.trim(),
        body.city!.trim(),
        body.state!.trim(),
        body.postal_code!.trim(),
        (body.payment_method || 'cod').trim(),
        (body.payment_reference || '').trim(),
        subtotal,
        shippingFee,
        totalAmount,
        (body.notes || '').trim()
      );

    const orderId = Number(info.lastInsertRowid);
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, book_id, book_title, book_isbn, unit_price, quantity, line_total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of preparedItems) {
      insertItem.run(
        orderId,
        item.book_id,
        item.book_title,
        item.book_isbn,
        item.unit_price,
        item.quantity,
        item.line_total
      );
    }

    return hydrateOrder(orderId);
  });

  try {
    const order = createTx();
    res.status(201).json({ order });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Unable to process order',
    });
  }
});

app.get('/api/orders/lookup', (req, res) => {
  const orderNumber =
    typeof req.query.order_number === 'string' ? req.query.order_number.trim() : '';
  const contact =
    typeof req.query.email === 'string' && req.query.email.trim()
      ? req.query.email.trim()
      : typeof req.query.contact === 'string'
        ? req.query.contact.trim()
        : '';

  if (!orderNumber || !contact) {
    res.status(400).json({ error: 'Order number and email or phone number are required' });
    return;
  }

  const normalizedEmail = contact.toLowerCase();
  const normalizedPhone = contact.replace(/[^\d]/g, '');

  let row = db
    .prepare(
      `SELECT id FROM orders WHERE UPPER(order_number) = UPPER(?) AND LOWER(customer_email) = ?`
    )
    .get(orderNumber, normalizedEmail) as { id: number } | undefined;

  if (!row && normalizedPhone.length >= 6) {
    const candidates = db
      .prepare(`SELECT id, customer_phone FROM orders WHERE UPPER(order_number) = UPPER(?)`)
      .all(orderNumber) as Array<{ id: number; customer_phone: string }>;
    row = candidates.find(
      (c) => c.customer_phone.replace(/[^\d]/g, '').endsWith(normalizedPhone.slice(-8))
    );
  }

  if (!row) {
    res.status(404).json({ error: 'No matching order found for those details.' });
    return;
  }

  res.json({ order: hydrateOrder(row.id) });
});

app.post('/api/inquiries', (req, res) => {
  const body = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    subject?: string;
    book_id?: number | null;
    channel?: 'web' | 'whatsapp';
    message?: string;
  };

  if (!body.name?.trim() || !body.email?.trim() || !body.subject?.trim() || !body.message?.trim()) {
    res.status(400).json({ error: 'Name, email, subject, and message are required.' });
    return;
  }

  let bookId: number | null = null;
  let bookTitle = '';
  if (body.book_id) {
    const book = db
      .prepare(`SELECT id, title FROM books WHERE id = ?`)
      .get(Number(body.book_id)) as { id: number; title: string } | undefined;
    if (book) {
      bookId = book.id;
      bookTitle = book.title;
    }
  }

  const channel = body.channel === 'whatsapp' ? 'whatsapp' : 'web';
  const info = db
    .prepare(
      `
      INSERT INTO inquiries (name, email, phone, subject, book_id, book_title, channel, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      body.name.trim(),
      body.email.trim(),
      (body.phone || '').trim(),
      body.subject.trim(),
      bookId,
      bookTitle,
      channel,
      body.message.trim()
    );

  const created = db
    .prepare(`SELECT * FROM inquiries WHERE id = ?`)
    .get(Number(info.lastInsertRowid));
  res.status(201).json({ inquiry: created });
});

// ============================================================================
// CUSTOMER AUTHENTICATION & BOOK REVIEWS ROUTES
// ============================================================================

function getBookReviewsPayload(bookId: number) {
  const reviews = db
    .prepare(
      `
      SELECT r.id, r.book_id, r.customer_id, c.name as customer_name,
             r.rating, r.title, r.comment, r.verified_purchase,
             r.created_at, r.updated_at
      FROM book_reviews r
      JOIN customer_users c ON c.id = r.customer_id
      WHERE r.book_id = ?
      ORDER BY r.updated_at DESC, r.id DESC
      `
    )
    .all(bookId) as Array<{
    id: number;
    book_id: number;
    customer_id: number;
    customer_name: string;
    rating: number;
    title: string;
    comment: string;
    verified_purchase: number;
    created_at: string;
    updated_at: string;
  }>;

  const breakdown: Record<'1' | '2' | '3' | '4' | '5', number> = {
    '5': 0,
    '4': 0,
    '3': 0,
    '2': 0,
    '1': 0,
  };
  let sum = 0;
  for (const r of reviews) {
    sum += r.rating;
    const key = String(r.rating) as '1' | '2' | '3' | '4' | '5';
    if (breakdown[key] !== undefined) {
      breakdown[key] += 1;
    }
  }

  return {
    summary: {
      average_rating: reviews.length > 0 ? Number((sum / reviews.length).toFixed(1)) : 0,
      total_reviews: reviews.length,
      breakdown,
    },
    reviews: reviews.map((r) => ({
      ...r,
      verified_purchase: Boolean(r.verified_purchase),
    })),
  };
}

app.post('/api/customers/register', (req, res) => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };
  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db
    .prepare(`SELECT id FROM customer_users WHERE LOWER(email) = ?`)
    .get(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    return;
  }

  const info = db
    .prepare(`INSERT INTO customer_users (name, email, password_hash) VALUES (?, ?, ?)`)
    .run(name.trim(), normalizedEmail, hashPassword(password));

  const customer = {
    id: Number(info.lastInsertRowid),
    name: name.trim(),
    email: normalizedEmail,
  };

  const token = signSessionToken({ ...customer, role: 'customer' });
  res.cookie(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttpsRequest(req),
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
  });

  res.status(201).json({ customer });
});

app.post('/api/customers/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const row = db
    .prepare(`SELECT id, name, email, password_hash FROM customer_users WHERE LOWER(email) = ?`)
    .get(email.trim().toLowerCase()) as
    | { id: number; name: string; email: string; password_hash: string }
    | undefined;

  if (!row || !verifyPassword(password, row.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const customer = { id: row.id, name: row.name, email: row.email };
  const token = signSessionToken({ ...customer, role: 'customer' });
  res.cookie(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttpsRequest(req),
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
  });

  res.json({ customer });
});

app.post('/api/customers/logout', (_req, res) => {
  res.clearCookie(CUSTOMER_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/customers/me', requireCustomer, (req: AuthenticatedRequest, res) => {
  res.json({
    customer: {
      id: req.customerUser!.id,
      name: req.customerUser!.name,
      email: req.customerUser!.email,
    },
  });
});

app.get('/api/books/:id/reviews', (req, res) => {
  const bookId = Number(req.params.id);
  if (!Number.isInteger(bookId)) {
    res.status(400).json({ error: 'Invalid book ID' });
    return;
  }
  const book = db
    .prepare(`SELECT id FROM books WHERE id = ? AND is_published = 1`)
    .get(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  res.json(getBookReviewsPayload(bookId));
});

app.post('/api/books/:id/reviews', requireCustomer, (req: AuthenticatedRequest, res) => {
  const bookId = Number(req.params.id);
  if (!Number.isInteger(bookId)) {
    res.status(400).json({ error: 'Invalid book ID' });
    return;
  }
  const book = db
    .prepare(`SELECT id FROM books WHERE id = ? AND is_published = 1`)
    .get(bookId);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const { rating, title, comment } = req.body as {
    rating?: number;
    title?: string;
    comment?: string;
  };
  const numericRating = Math.round(Number(rating));
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    res.status(400).json({ error: 'Please select a star rating between 1 and 5.' });
    return;
  }
  if (!comment?.trim() || comment.trim().length < 5) {
    res.status(400).json({ error: 'Please enter a review comment (at least 5 characters).' });
    return;
  }

  const customer = req.customerUser!;
  const verifiedRow = db
    .prepare(
      `
      SELECT o.id
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE LOWER(o.customer_email) = ? AND oi.book_id = ? AND o.order_status != 'cancelled'
      LIMIT 1
      `
    )
    .get(customer.email.toLowerCase(), bookId);

  const verifiedFlag = verifiedRow ? 1 : 0;

  db.prepare(
    `
    INSERT INTO book_reviews (book_id, customer_id, rating, title, comment, verified_purchase)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(book_id, customer_id) DO UPDATE SET
      rating = excluded.rating,
      title = excluded.title,
      comment = excluded.comment,
      verified_purchase = MAX(book_reviews.verified_purchase, excluded.verified_purchase),
      updated_at = datetime('now')
    `
  ).run(
    bookId,
    customer.id,
    numericRating,
    (title || '').trim().slice(0, 120),
    comment.trim().slice(0, 2000),
    verifiedFlag
  );

  res.status(201).json(getBookReviewsPayload(bookId));
});

app.delete(
  '/api/books/:id/reviews/:reviewId',
  requireCustomer,
  (req: AuthenticatedRequest, res) => {
    const bookId = Number(req.params.id);
    const reviewId = Number(req.params.reviewId);
    if (!Number.isInteger(bookId) || !Number.isInteger(reviewId)) {
      res.status(400).json({ error: 'Invalid review ID' });
      return;
    }

    const result = db
      .prepare(`DELETE FROM book_reviews WHERE id = ? AND book_id = ? AND customer_id = ?`)
      .run(reviewId, bookId, req.customerUser!.id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Review not found or not owned by you' });
      return;
    }

    res.json(getBookReviewsPayload(bookId));
  }
);

// ============================================================================
// ADMIN AUTHENTICATION ROUTES
// ============================================================================

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email?.trim() || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const admin = db
    .prepare(`SELECT id, email, password_hash, name FROM admin_users WHERE LOWER(email) = ?`)
    .get(email.trim().toLowerCase()) as
    | { id: number; email: string; password_hash: string; name: string }
    | undefined;

  if (!admin || !verifyPassword(password, admin.password_hash)) {
    res.status(401).json({ error: 'Invalid admin email or password' });
    return;
  }

  const token = signSessionToken({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: 'admin',
  });
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttpsRequest(req),
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
  });

  res.json({ admin: { id: admin.id, email: admin.email, name: admin.name } });
});

app.post('/api/admin/logout', (_req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAdmin, (req: AuthenticatedRequest, res) => {
  res.json({
    admin: {
      id: req.adminUser!.id,
      email: req.adminUser!.email,
      name: req.adminUser!.name,
    },
  });
});

// ============================================================================
// PROTECTED ADMIN MANAGEMENT ROUTES
// ============================================================================

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const bookStats = db
    .prepare(
      `
      SELECT
        COUNT(*) as total_books,
        SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_books,
        SUM(CASE WHEN stock_quantity <= 0 OR is_available = 0 THEN 1 ELSE 0 END) as out_of_stock_books
      FROM books
      `
    )
    .get() as { total_books: number; published_books: number; out_of_stock_books: number };

  const orderStats = db
    .prepare(
      `
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        COALESCE(SUM(CASE WHEN order_status != 'cancelled' THEN total_amount ELSE 0 END), 0) as total_revenue
      FROM orders
      `
    )
    .get() as { total_orders: number; pending_orders: number; total_revenue: number };

  const inquiryStats = db
    .prepare(
      `SELECT COUNT(*) as open_inquiries FROM inquiries WHERE status != 'resolved'`
    )
    .get() as { open_inquiries: number };

  res.json({
    total_books: bookStats.total_books || 0,
    published_books: bookStats.published_books || 0,
    out_of_stock_books: bookStats.out_of_stock_books || 0,
    total_orders: orderStats.total_orders || 0,
    pending_orders: orderStats.pending_orders || 0,
    total_revenue: Number((orderStats.total_revenue || 0).toFixed(2)),
    open_inquiries: inquiryStats.open_inquiries || 0,
  });
});

app.get('/api/admin/analytics', requireAdmin, (_req, res) => {
  const summaryRow = db
    .prepare(
      `
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN order_status != 'cancelled' THEN total_amount ELSE 0 END), 0) as net_revenue,
        COALESCE(AVG(CASE WHEN order_status != 'cancelled' THEN total_amount END), 0) as avg_order_value
      FROM orders
      `
    )
    .get() as { total_orders: number; net_revenue: number; avg_order_value: number };

  const unitsRow = db
    .prepare(
      `
      SELECT COALESCE(SUM(oi.quantity), 0) as total_units
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.order_status != 'cancelled'
      `
    )
    .get() as { total_units: number };

  const inventoryRow = db
    .prepare(
      `
      SELECT
        COALESCE(SUM(stock_quantity), 0) as total_stock_units,
        COALESCE(SUM(price * stock_quantity), 0) as inventory_retail_value,
        SUM(CASE WHEN stock_quantity <= 5 AND is_published = 1 THEN 1 ELSE 0 END) as low_stock_titles
      FROM books
      `
    )
    .get() as { total_stock_units: number; inventory_retail_value: number; low_stock_titles: number };

  const reviewRow = db
    .prepare(
      `
      SELECT COUNT(*) as total_reviews, COALESCE(ROUND(AVG(rating), 1), 0) as average_rating
      FROM book_reviews
      `
    )
    .get() as { total_reviews: number; average_rating: number };

  const monthlyRevenue = db
    .prepare(
      `
      SELECT strftime('%Y-%m', created_at) as month,
             COUNT(*) as order_count,
             COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE order_status != 'cancelled'
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
      LIMIT 12
      `
    )
    .all() as Array<{ month: string; order_count: number; revenue: number }>;

  const orderStatusBreakdown = db
    .prepare(
      `SELECT order_status as status, COUNT(*) as count FROM orders GROUP BY order_status`
    )
    .all() as Array<{ status: string; count: number }>;

  const paymentMethodBreakdown = db
    .prepare(
      `
      SELECT payment_method as method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE order_status != 'cancelled'
      GROUP BY payment_method
      `
    )
    .all() as Array<{ method: string; count: number; revenue: number }>;

  const categoryPerformance = db
    .prepare(
      `
      SELECT c.id, c.name,
             COUNT(DISTINCT b.id) as book_count,
             COALESCE(SUM(b.stock_quantity), 0) as stock_units,
             COALESCE((
               SELECT SUM(oi.quantity)
               FROM order_items oi
               JOIN orders o ON o.id = oi.order_id
               JOIN books b2 ON b2.id = oi.book_id
               WHERE b2.category_id = c.id AND o.order_status != 'cancelled'
             ), 0) as units_sold,
             COALESCE((
               SELECT SUM(oi.line_total)
               FROM order_items oi
               JOIN orders o ON o.id = oi.order_id
               JOIN books b2 ON b2.id = oi.book_id
               WHERE b2.category_id = c.id AND o.order_status != 'cancelled'
             ), 0) as revenue
      FROM categories c
      LEFT JOIN books b ON b.category_id = c.id
      GROUP BY c.id
      ORDER BY revenue DESC, book_count DESC
      `
    )
    .all() as Array<{
    id: number;
    name: string;
    book_count: number;
    stock_units: number;
    units_sold: number;
    revenue: number;
  }>;

  const topBooks = db
    .prepare(
      `
      SELECT b.id, b.title, b.author, b.price, b.stock_quantity,
             COALESCE(SUM(CASE WHEN o.order_status != 'cancelled' THEN oi.quantity ELSE 0 END), 0) as units_sold,
             COALESCE(SUM(CASE WHEN o.order_status != 'cancelled' THEN oi.line_total ELSE 0 END), 0) as revenue,
             COALESCE((SELECT ROUND(AVG(rating), 1) FROM book_reviews br WHERE br.book_id = b.id), 0) as average_rating,
             COALESCE((SELECT COUNT(*) FROM book_reviews br WHERE br.book_id = b.id), 0) as review_count
      FROM books b
      LEFT JOIN order_items oi ON oi.book_id = b.id
      LEFT JOIN orders o ON o.id = oi.order_id
      GROUP BY b.id
      ORDER BY units_sold DESC, revenue DESC, review_count DESC, b.id ASC
      LIMIT 6
      `
    )
    .all() as Array<{
    id: number;
    title: string;
    author: string;
    price: number;
    stock_quantity: number;
    units_sold: number;
    revenue: number;
    average_rating: number;
    review_count: number;
  }>;

  const inquiryChannels = db
    .prepare(`SELECT channel, COUNT(*) as count FROM inquiries GROUP BY channel`)
    .all() as Array<{ channel: string; count: number }>;

  res.json({
    kpis: {
      net_revenue: Number((summaryRow.net_revenue || 0).toFixed(2)),
      avg_order_value: Number((summaryRow.avg_order_value || 0).toFixed(2)),
      total_units_sold: unitsRow.total_units || 0,
      total_stock_units: inventoryRow.total_stock_units || 0,
      inventory_retail_value: Number((inventoryRow.inventory_retail_value || 0).toFixed(2)),
      low_stock_titles: inventoryRow.low_stock_titles || 0,
      total_reviews: reviewRow.total_reviews || 0,
      average_rating: Number(reviewRow.average_rating || 0),
    },
    monthly_revenue: monthlyRevenue,
    order_status_breakdown: orderStatusBreakdown,
    payment_method_breakdown: paymentMethodBreakdown,
    category_performance: categoryPerformance,
    top_books: topBooks,
    inquiry_channels: inquiryChannels,
  });
});

app.get('/api/admin/books', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `
      SELECT b.*, c.name as category_name, c.slug as category_slug
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      ORDER BY b.created_at DESC, b.id DESC
      `
    )
    .all() as BookRow[];
  res.json(rows.map(serializeAdminBook));
});

const uploadBookFields = bookUpload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'sample_pdf', maxCount: 1 },
  { name: 'private_pdf', maxCount: 1 },
]);

app.post('/api/admin/books', requireAdmin, uploadBookFields, (req, res) => {
  const body = req.body as Record<string, string | undefined>;
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;

  if (!body.title?.trim() || !body.author?.trim() || !body.isbn?.trim() || !body.description?.trim()) {
    res.status(400).json({ error: 'Title, author, ISBN, and description are required.' });
    return;
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) {
    res.status(400).json({ error: 'Valid non-negative price is required.' });
    return;
  }

  const slug = generateUniqueBookSlug(body.title);
  const categoryId = body.category_id ? Number(body.category_id) : null;
  const coverPath = files?.cover?.[0]?.filename || '';
  const samplePdfPath = files?.sample_pdf?.[0]?.filename || '';
  const privatePdfPath = files?.private_pdf?.[0]?.filename || '';

  const info = db
    .prepare(
      `
      INSERT INTO books (
        title, slug, author, isbn, description, price, category_id,
        cover_path, sample_pdf_path, private_pdf_path,
        pages, language, binding, publication_year,
        stock_quantity, is_available, is_featured, is_new_arrival, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      body.title.trim(),
      slug,
      body.author.trim(),
      body.isbn.trim(),
      body.description.trim(),
      price,
      categoryId,
      coverPath,
      samplePdfPath,
      privatePdfPath,
      Math.max(0, Number(body.pages) || 0),
      (body.language || 'English').trim(),
      (body.binding || 'Hardcover').trim(),
      Number(body.publication_year) || new Date().getFullYear(),
      Math.max(0, Number(body.stock_quantity) || 0),
      body.is_available === 'false' ? 0 : 1,
      body.is_featured === 'true' ? 1 : 0,
      body.is_new_arrival === 'false' ? 0 : 1,
      body.is_published === 'false' ? 0 : 1
    );

  syncAuthorsFromBooks();

  const created = db
    .prepare(
      `
      SELECT b.*, c.name as category_name, c.slug as category_slug
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      WHERE b.id = ?
      `
    )
    .get(Number(info.lastInsertRowid)) as BookRow;

  res.status(201).json({ book: serializeAdminBook(created) });
});

app.put('/api/admin/books/:id', requireAdmin, uploadBookFields, (req, res) => {
  const bookId = Number(req.params.id);
  const existing = db.prepare(`SELECT * FROM books WHERE id = ?`).get(bookId) as
    | BookRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const body = req.body as Record<string, string | undefined>;
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;

  const title = body.title?.trim() || existing.title;
  const author = body.author?.trim() || existing.author;
  const isbn = body.isbn?.trim() || existing.isbn;
  const description = body.description?.trim() || existing.description;
  const price = body.price !== undefined ? Number(body.price) : existing.price;
  const slug = title !== existing.title ? generateUniqueBookSlug(title, bookId) : existing.slug;
  const categoryId =
    body.category_id !== undefined
      ? body.category_id
        ? Number(body.category_id)
        : null
      : existing.category_id;

  let coverPath = existing.cover_path;
  if (files?.cover?.[0]) {
    if (existing.cover_path && !existing.cover_path.startsWith('/src/assets/')) {
      deleteStoredFile(COVERS_DIR, existing.cover_path);
    }
    coverPath = files.cover[0].filename;
  }

  let samplePdfPath = existing.sample_pdf_path;
  if (files?.sample_pdf?.[0]) {
    deleteStoredFile(SAMPLE_PDFS_DIR, existing.sample_pdf_path);
    samplePdfPath = files.sample_pdf[0].filename;
  }

  let privatePdfPath = existing.private_pdf_path;
  if (files?.private_pdf?.[0]) {
    deleteStoredFile(PRIVATE_PDFS_DIR, existing.private_pdf_path);
    privatePdfPath = files.private_pdf[0].filename;
  }

  db.prepare(
    `
    UPDATE books SET
      title = ?, slug = ?, author = ?, isbn = ?, description = ?, price = ?,
      category_id = ?, cover_path = ?, sample_pdf_path = ?, private_pdf_path = ?,
      pages = ?, language = ?, binding = ?, publication_year = ?,
      stock_quantity = ?, is_available = ?, is_featured = ?, is_new_arrival = ?,
      is_published = ?, updated_at = datetime('now')
    WHERE id = ?
    `
  ).run(
    title,
    slug,
    author,
    isbn,
    description,
    price,
    categoryId,
    coverPath,
    samplePdfPath,
    privatePdfPath,
    body.pages !== undefined ? Math.max(0, Number(body.pages) || 0) : existing.pages,
    body.language?.trim() || existing.language,
    body.binding?.trim() || existing.binding,
    body.publication_year !== undefined
      ? Number(body.publication_year) || existing.publication_year
      : existing.publication_year,
    body.stock_quantity !== undefined
      ? Math.max(0, Number(body.stock_quantity) || 0)
      : existing.stock_quantity,
    body.is_available !== undefined ? (body.is_available === 'true' ? 1 : 0) : existing.is_available,
    body.is_featured !== undefined ? (body.is_featured === 'true' ? 1 : 0) : existing.is_featured,
    body.is_new_arrival !== undefined
      ? body.is_new_arrival === 'true'
        ? 1
        : 0
      : existing.is_new_arrival,
    body.is_published !== undefined ? (body.is_published === 'true' ? 1 : 0) : existing.is_published,
    bookId
  );

  syncAuthorsFromBooks();

  const updated = db
    .prepare(
      `
      SELECT b.*, c.name as category_name, c.slug as category_slug,
             a.slug as author_slug
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      LEFT JOIN authors a ON LOWER(a.name) = LOWER(TRIM(b.author))
      WHERE b.id = ?
      `
    )
    .get(bookId) as BookRow;

  res.json({ book: serializeAdminBook(updated) });
});

app.patch('/api/admin/books/:id/inventory', requireAdmin, (req, res) => {
  const bookId = Number(req.params.id);
  const existing = db.prepare(`SELECT id FROM books WHERE id = ?`).get(bookId);
  if (!existing) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  const { stock_quantity, is_available, is_published } = req.body as {
    stock_quantity: number;
    is_available: boolean;
    is_published: boolean;
  };

  db.prepare(
    `
    UPDATE books SET
      stock_quantity = ?, is_available = ?, is_published = ?, updated_at = datetime('now')
    WHERE id = ?
    `
  ).run(
    Math.max(0, Math.floor(Number(stock_quantity) || 0)),
    is_available ? 1 : 0,
    is_published ? 1 : 0,
    bookId
  );

  const updated = db
    .prepare(
      `
      SELECT b.*, c.name as category_name, c.slug as category_slug
      FROM books b
      LEFT JOIN categories c ON c.id = b.category_id
      WHERE b.id = ?
      `
    )
    .get(bookId) as BookRow;

  res.json({ book: serializeAdminBook(updated) });
});

app.delete('/api/admin/books/:id', requireAdmin, (req, res) => {
  const bookId = Number(req.params.id);
  const existing = db.prepare(`SELECT * FROM books WHERE id = ?`).get(bookId) as
    | BookRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }

  if (existing.cover_path && !existing.cover_path.startsWith('/src/assets/')) {
    deleteStoredFile(COVERS_DIR, existing.cover_path);
  }
  deleteStoredFile(SAMPLE_PDFS_DIR, existing.sample_pdf_path);
  deleteStoredFile(PRIVATE_PDFS_DIR, existing.private_pdf_path);

  db.prepare(`DELETE FROM books WHERE id = ?`).run(bookId);
  res.json({ ok: true });
});

// Admin-only endpoint to access private full manuscript PDFs (NEVER publicly accessible)
app.get('/api/admin/books/:id/private-pdf', requireAdmin, (req, res) => {
  const bookId = Number(req.params.id);
  const row = db
    .prepare(`SELECT title, private_pdf_path FROM books WHERE id = ?`)
    .get(bookId) as { title: string; private_pdf_path: string } | undefined;

  if (!row || !row.private_pdf_path) {
    res.status(404).json({ error: 'Private manuscript PDF not found' });
    return;
  }

  const safePath = resolveSafeFilePath(PRIVATE_PDFS_DIR, row.private_pdf_path);
  if (!safePath || !fs.existsSync(safePath)) {
    res.status(404).json({ error: 'Private PDF missing from secure storage' });
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${slugify(row.title)}-private-manuscript.pdf"`
  );
  res.sendFile(safePath);
});

// Admin Categories
app.get('/api/admin/categories', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `
      SELECT c.id, c.name, c.slug, c.description, c.created_at, COUNT(b.id) as book_count
      FROM categories c
      LEFT JOIN books b ON b.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
      `
    )
    .all();
  res.json(rows);
});

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { name, description } = req.body as { name?: string; description?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }
  const slug = generateUniqueCategorySlug(name);
  try {
    const info = db
      .prepare(`INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)`)
      .run(name.trim(), slug, (description || '').trim());
    const created = db
      .prepare(`SELECT *, 0 as book_count FROM categories WHERE id = ?`)
      .get(Number(info.lastInsertRowid));
    res.status(201).json({ category: created });
  } catch {
    res.status(400).json({ error: 'A category with that name already exists' });
  }
});

app.put('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { name, description } = req.body as { name?: string; description?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }
  const slug = generateUniqueCategorySlug(name, id);
  db.prepare(`UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?`).run(
    name.trim(),
    slug,
    (description || '').trim(),
    id
  );
  const updated = db
    .prepare(
      `
      SELECT c.*, COUNT(b.id) as book_count
      FROM categories c LEFT JOIN books b ON b.category_id = c.id
      WHERE c.id = ? GROUP BY c.id
      `
    )
    .get(id);
  res.json({ category: updated });
});

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.prepare(`DELETE FROM categories WHERE id = ?`).run(id);
  res.json({ ok: true });
});

// Admin Orders
app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  const orders = db.prepare(`SELECT id FROM orders ORDER BY created_at DESC, id DESC`).all() as Array<{
    id: number;
  }>;
  res.json(orders.map((o) => hydrateOrder(o.id)));
});

app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { order_status, payment_status } = req.body as {
    order_status?: string;
    payment_status?: string;
  };
  const validOrder = new Set(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);
  const validPayment = new Set(['pending', 'paid', 'failed', 'refunded']);

  if (order_status && !validOrder.has(order_status)) {
    res.status(400).json({ error: 'Invalid order status' });
    return;
  }
  if (payment_status && !validPayment.has(payment_status)) {
    res.status(400).json({ error: 'Invalid payment status' });
    return;
  }

  const existing = db.prepare(`SELECT id, order_status, payment_status FROM orders WHERE id = ?`).get(id) as
    | { id: number; order_status: string; payment_status: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  db.prepare(
    `UPDATE orders SET order_status = ?, payment_status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    order_status || existing.order_status,
    payment_status || existing.payment_status,
    id
  );

  res.json({ order: hydrateOrder(id) });
});

// Admin Inquiries
app.get('/api/admin/inquiries', requireAdmin, (_req, res) => {
  const rows = db.prepare(`SELECT * FROM inquiries ORDER BY created_at DESC, id DESC`).all();
  res.json(rows);
});

app.patch('/api/admin/inquiries/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { status, admin_notes } = req.body as { status?: string; admin_notes?: string };
  const validStatuses = new Set(['new', 'in_progress', 'resolved']);
  if (status && !validStatuses.has(status)) {
    res.status(400).json({ error: 'Invalid inquiry status' });
    return;
  }

  db.prepare(
    `UPDATE inquiries SET status = COALESCE(?, status), admin_notes = COALESCE(?, admin_notes), updated_at = datetime('now') WHERE id = ?`
  ).run(status || null, admin_notes ?? null, id);

  const updated = db.prepare(`SELECT * FROM inquiries WHERE id = ?`).get(id);
  res.json({ inquiry: updated });
});

// Admin Authors Management
app.get('/api/admin/authors', requireAdmin, (_req, res) => {
  syncAuthorsFromBooks();
  const rows = db
    .prepare(
      `
      SELECT a.*, COUNT(b.id) as book_count
      FROM authors a
      LEFT JOIN books b ON LOWER(TRIM(b.author)) = LOWER(a.name)
      GROUP BY a.id
      ORDER BY a.name ASC
      `
    )
    .all();
  res.json(rows);
});

app.put('/api/admin/authors/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT id FROM authors WHERE id = ?`).get(id);
  if (!existing) {
    res.status(404).json({ error: 'Author not found' });
    return;
  }
  const { credentials, affiliation, location, bio } = req.body as {
    credentials?: string;
    affiliation?: string;
    location?: string;
    bio?: string;
  };
  db.prepare(
    `
    UPDATE authors SET
      credentials = ?, affiliation = ?, location = ?, bio = ?, updated_at = datetime('now')
    WHERE id = ?
    `
  ).run(
    (credentials || '').trim(),
    (affiliation || '').trim(),
    (location || '').trim(),
    (bio || '').trim(),
    id
  );
  const updated = db
    .prepare(
      `
      SELECT a.*, COUNT(b.id) as book_count
      FROM authors a
      LEFT JOIN books b ON LOWER(TRIM(b.author)) = LOWER(a.name)
      WHERE a.id = ?
      GROUP BY a.id
      `
    )
    .get(id);
  res.json({ author: updated });
});

// Admin News & Publication Updates
app.get('/api/admin/updates', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `
      SELECT u.*, b.title as related_book_title, b.slug as related_book_slug
      FROM publication_updates u
      LEFT JOIN books b ON b.id = u.related_book_id
      ORDER BY u.published_at DESC, u.id DESC
      `
    )
    .all() as Array<Record<string, unknown>>;

  res.json(
    rows.map((r) => ({
      ...r,
      is_published: Boolean(r.is_published),
    }))
  );
});

app.post('/api/admin/updates', requireAdmin, (req, res) => {
  const { title, category, summary, content, related_book_id, is_published } = req.body as {
    title?: string;
    category?: string;
    summary?: string;
    content?: string;
    related_book_id?: number | null;
    is_published?: boolean;
  };

  if (!title?.trim() || !summary?.trim() || !content?.trim()) {
    res.status(400).json({ error: 'Title, summary, and full update content are required.' });
    return;
  }

  const validCats = new Set(['new-release', 'announcement', 'event', 'press']);
  const cat = category && validCats.has(category) ? category : 'announcement';
  const slug = generateUniqueUpdateSlug(title);
  const info = db
    .prepare(
      `
      INSERT INTO publication_updates (
        title, slug, category, summary, content, related_book_id, is_published, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `
    )
    .run(
      title.trim(),
      slug,
      cat,
      summary.trim(),
      content.trim(),
      related_book_id ? Number(related_book_id) : null,
      is_published === false ? 0 : 1
    );

  const created = db
    .prepare(
      `
      SELECT u.*, b.title as related_book_title, b.slug as related_book_slug
      FROM publication_updates u
      LEFT JOIN books b ON b.id = u.related_book_id
      WHERE u.id = ?
      `
    )
    .get(Number(info.lastInsertRowid)) as Record<string, unknown>;

  res.status(201).json({ update: { ...created, is_published: Boolean(created.is_published) } });
});

app.put('/api/admin/updates/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT id, title, slug FROM publication_updates WHERE id = ?`).get(id) as
    | { id: number; title: string; slug: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Publication update not found' });
    return;
  }

  const { title, category, summary, content, related_book_id, is_published } = req.body as {
    title?: string;
    category?: string;
    summary?: string;
    content?: string;
    related_book_id?: number | null;
    is_published?: boolean;
  };
  if (!title?.trim() || !summary?.trim() || !content?.trim()) {
    res.status(400).json({ error: 'Title, summary, and full update content are required.' });
    return;
  }

  const validCats = new Set(['new-release', 'announcement', 'event', 'press']);
  const cat = category && validCats.has(category) ? category : 'announcement';
  const slug = title.trim() !== existing.title ? generateUniqueUpdateSlug(title, id) : existing.slug;

  db.prepare(
    `
    UPDATE publication_updates SET
      title = ?, slug = ?, category = ?, summary = ?, content = ?,
      related_book_id = ?, is_published = ?, updated_at = datetime('now')
    WHERE id = ?
    `
  ).run(
    title.trim(),
    slug,
    cat,
    summary.trim(),
    content.trim(),
    related_book_id ? Number(related_book_id) : null,
    is_published === false ? 0 : 1,
    id
  );

  const updated = db
    .prepare(
      `
      SELECT u.*, b.title as related_book_title, b.slug as related_book_slug
      FROM publication_updates u
      LEFT JOIN books b ON b.id = u.related_book_id
      WHERE u.id = ?
      `
    )
    .get(id) as Record<string, unknown>;

  res.json({ update: { ...updated, is_published: Boolean(updated.is_published) } });
});

app.delete('/api/admin/updates/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.prepare(`DELETE FROM publication_updates WHERE id = ?`).run(id);
  res.json({ ok: true });
});

// Admin Settings
app.get('/api/admin/settings', requireAdmin, (_req, res) => {
  const s = getSettingsMap();
  res.json({
    ...getPublicStoreConfig(),
    has_payment_gateway_secret: Boolean(s.payment_gateway_secret_key),
  });
});

app.put('/api/admin/settings', requireAdmin, (req: AuthenticatedRequest, res) => {
  const body = req.body as Record<string, unknown>;

  // Optional password update
  if (typeof body.new_admin_password === 'string' && body.new_admin_password.length > 0) {
    if (body.new_admin_password.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters.' });
      return;
    }
    const adminRow = db
      .prepare(`SELECT id, password_hash FROM admin_users WHERE id = ?`)
      .get(req.adminUser!.id) as { id: number; password_hash: string } | undefined;

    if (
      !adminRow ||
      typeof body.current_admin_password !== 'string' ||
      !verifyPassword(body.current_admin_password, adminRow.password_hash)
    ) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }
    db.prepare(`UPDATE admin_users SET password_hash = ? WHERE id = ?`).run(
      hashPassword(body.new_admin_password),
      adminRow.id
    );
  }

  const allowedKeys = [
    'publisher_name',
    'support_email',
    'support_phone',
    'whatsapp_number',
    'business_address',
    'currency',
    'free_shipping_threshold',
    'standard_shipping_fee',
    'payment_cod_enabled',
    'payment_upi_enabled',
    'payment_upi_id',
    'payment_gateway_provider',
    'payment_gateway_public_key',
    'payment_gateway_secret_key',
    'payment_gateway_mode',
    'founder_name',
    'founder_designation',
    'founder_credentials',
    'founder_bio',
  ];

  const upsert = db.prepare(
    `
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `
  );

  for (const key of allowedKeys) {
    if (body[key] !== undefined && body[key] !== null) {
      if (key === 'payment_gateway_secret_key' && String(body[key]).trim() === '') {
        continue;
      }
      upsert.run(key, String(body[key]));
    }
  }

  const s = getSettingsMap();
  res.json({
    ...getPublicStoreConfig(),
    has_payment_gateway_secret: Boolean(s.payment_gateway_secret_key),
  });
});

app.post(
  '/api/admin/leadership/photo',
  requireAdmin,
  leadershipPhotoUpload.single('photo'),
  (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'Please select a valid portrait image (JPG, PNG, or WEBP).' });
      return;
    }

    const current = db
      .prepare(`SELECT value FROM settings WHERE key = 'founder_photo_url'`)
      .get() as { value: string } | undefined;
    if (current?.value && current.value.startsWith('/api/media/covers/')) {
      const oldFilename = decodeURIComponent(current.value.slice('/api/media/covers/'.length));
      deleteStoredFile(COVERS_DIR, oldFilename);
    }

    const photoUrl = `/api/media/covers/${encodeURIComponent(req.file.filename)}`;
    db.prepare(
      `
      INSERT INTO settings (key, value, updated_at) VALUES ('founder_photo_url', ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
      `
    ).run(photoUrl);

    const s = getSettingsMap();
    res.json({
      founder_photo_url: photoUrl,
      settings: {
        ...getPublicStoreConfig(),
        has_payment_gateway_secret: Boolean(s.payment_gateway_secret_key),
      },
    });
  }
);

app.delete('/api/admin/leadership/photo', requireAdmin, (_req, res) => {
  const current = db
    .prepare(`SELECT value FROM settings WHERE key = 'founder_photo_url'`)
    .get() as { value: string } | undefined;
  if (current?.value && current.value.startsWith('/api/media/covers/')) {
    const oldFilename = decodeURIComponent(current.value.slice('/api/media/covers/'.length));
    deleteStoredFile(COVERS_DIR, oldFilename);
  }
  db.prepare(
    `
    INSERT INTO settings (key, value, updated_at) VALUES ('founder_photo_url', '', datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = '', updated_at = datetime('now')
    `
  ).run();
  const s = getSettingsMap();
  res.json({
    founder_photo_url: '',
    settings: {
      ...getPublicStoreConfig(),
      has_payment_gateway_secret: Boolean(s.payment_gateway_secret_key),
    },
  });
});

// Express JSON error handler for /api routes (catches multer upload validation errors cleanly)
app.use('/api', (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(400).json({ error: message });
});

function resolveOrigin(req: Request): string {
  if (process.env.APP_URL && /^https?:\/\//i.test(process.env.APP_URL)) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '')
    .split(',')[0]
    .trim();
  const proto = forwardedProto || req.protocol || 'http';
  const host = forwardedHost || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

app.get('/robots.txt', (req, res) => {
  const origin = resolveOrigin(req).replace(/\/+$/, '');
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin/\nSitemap: ${origin}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', (req, res) => {
  const origin = resolveOrigin(req);
  res.type('application/xml').send(buildSitemapXml(origin));
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        next();
        return;
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        const template = fs.readFileSync(indexPath, 'utf8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, template);
        const withSeo = injectSeoIntoHtml(transformed, req.originalUrl, resolveOrigin(req));
        res.status(200).set({ 'Content-Type': 'text/html' }).end(withSeo);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, { index: false }));
    app.get('*', (req, res) => {
      const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
      const withSeo = injectSeoIntoHtml(indexHtml, req.originalUrl, resolveOrigin(req));
      res.status(200).set({ 'Content-Type': 'text/html' }).end(withSeo);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bhagwati Publications server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
