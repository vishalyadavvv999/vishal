import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { hashPassword } from './auth.ts';
import { createSamplePdfFile } from './pdf.ts';
import { ensureStorageDirectories, SAMPLE_PDFS_DIR } from './uploads.ts';

const DB_PATH = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH || 'data/bhagwati.db'
);

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

export function initializeDatabase(): void {
  ensureStorageDirectories();

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      author TEXT NOT NULL,
      isbn TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      cover_path TEXT NOT NULL DEFAULT '',
      sample_pdf_path TEXT NOT NULL DEFAULT '',
      private_pdf_path TEXT NOT NULL DEFAULT '',
      pages INTEGER NOT NULL DEFAULT 0,
      language TEXT NOT NULL DEFAULT 'English',
      binding TEXT NOT NULL DEFAULT 'Hardcover',
      publication_year INTEGER NOT NULL DEFAULT 2026,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      is_available INTEGER NOT NULL DEFAULT 1,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_new_arrival INTEGER NOT NULL DEFAULT 1,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_reference TEXT NOT NULL DEFAULT '',
      order_status TEXT NOT NULL DEFAULT 'pending',
      subtotal REAL NOT NULL,
      shipping_fee REAL NOT NULL,
      total_amount REAL NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
      book_title TEXT NOT NULL,
      book_isbn TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      line_total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL,
      book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
      book_title TEXT NOT NULL DEFAULT '',
      channel TEXT NOT NULL DEFAULT 'web',
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      admin_notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customer_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS book_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      title TEXT NOT NULL DEFAULT '',
      comment TEXT NOT NULL,
      verified_purchase INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(book_id, customer_id)
    );

    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      credentials TEXT NOT NULL DEFAULT '',
      affiliation TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS publication_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'announcement',
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      related_book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      published_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed default store settings if absent (no fake company contact info!)
  const defaultSettings: Record<string, string> = {
    publisher_name: 'Bhagwati Publications',
    support_email: '',
    support_phone: '',
    whatsapp_number: '',
    business_address: '',
    currency: 'INR',
    free_shipping_threshold: '999',
    standard_shipping_fee: '60',
    payment_cod_enabled: 'true',
    payment_upi_enabled: 'false',
    payment_upi_id: '',
    payment_gateway_provider: 'none',
    payment_gateway_public_key: '',
    payment_gateway_secret_key: '',
    payment_gateway_mode: 'test',
    founder_name: 'Dr. S.B. Saraswat',
    founder_designation: 'Director & Managing Head · Bhagwati Publications',
    founder_credentials:
      'Ph.D. · B.E. (Electrical & Industrial Engineering) · PG in ADR, Public Administration & Materials Management · ISO-9000 & High-Tension Electrical Certified',
    founder_bio:
      'Dr. S.B. Saraswat brings decades of international industrial leadership, institutional governance, and technical scholarship to Bhagwati Publications. He serves as Resident Director at Danieli Corus (Netherlands) and previously held senior executive appointments as Joint Director (Technical/Materials) at Steel Authority of India Limited (SAIL) and Director of Supply Chain Management at Global Steel Sofia (Europe).\n\nUnder his editorial stewardship, Bhagwati Publications advances rigorous academic, engineering, heritage, and management publishing for scholars, universities, and professional libraries.',
    founder_photo_url: '/assets/aistudio/images_117439bb.jpg',
  };

  const insertSetting = db.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
  );
  for (const [k, v] of Object.entries(defaultSettings)) {
    insertSetting.run(k, v);
  }

  // Seed owner admin account if empty (never hardcode a literal password in source)
  const adminCount = (db.prepare(`SELECT COUNT(*) as cnt FROM admin_users`).get() as { cnt: number }).cnt;
  if (adminCount === 0) {
    const email = (process.env.ADMIN_EMAIL || 'owner@bhagwatipublications.cv').toLowerCase();
    const envPassword = process.env.ADMIN_PASSWORD?.trim();
    const password = envPassword || crypto.randomBytes(12).toString('base64url');
    db.prepare(
      `INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)`
    ).run(email, hashPassword(password), 'Publisher Owner');
    if (!envPassword) {
      console.warn(
        `[Bootstrap] No ADMIN_PASSWORD set. Created initial admin (${email}) with temporary password: ${password}`
      );
    }
  }

  // Seed initial catalog categories & books if empty so storefront is immediately rich & interactive
  const catCount = (db.prepare(`SELECT COUNT(*) as cnt FROM categories`).get() as { cnt: number }).cnt;
  if (catCount === 0) {
    const seedCategories = [
      {
        name: 'Architecture & Heritage',
        slug: 'architecture-heritage',
        description: 'Monographs and visual studies on classical form, proportions, and built heritage.',
      },
      {
        name: 'Academic & Humanities',
        slug: 'academic-humanities',
        description: 'Peer-reviewed scholarship in philosophy, constitutional history, and classical thought.',
      },
      {
        name: 'Business & Strategy',
        slug: 'business-strategy',
        description: 'Analytical frameworks for institutional governance, strategy, and commerce.',
      },
      {
        name: 'Literature & Essays',
        slug: 'literature-essays',
        description: 'Curated literary anthologies, critical essays, and collector hardcover editions.',
      },
    ];
    const insertCat = db.prepare(
      `INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)`
    );
    for (const c of seedCategories) {
      insertCat.run(c.name, c.slug, c.description);
    }
  }

  const bookCount = (db.prepare(`SELECT COUNT(*) as cnt FROM books`).get() as { cnt: number }).cnt;
  if (bookCount === 0) {
    const getCatId = (slug: string): number | null => {
      const row = db.prepare(`SELECT id FROM categories WHERE slug = ?`).get(slug) as
        | { id: number }
        | undefined;
      return row ? row.id : null;
    };

    const seedBooks = [
      {
        title: 'Architectural Harmony: A Study in Classical Form',
        slug: 'architectural-harmony-study-in-classical-form',
        author: 'Eliza M. Harper',
        isbn: '978-93-84102-11-4',
        description:
          'An illustrated examination of classical proportions, colonnade symmetry, and enduring stone and timber craft. Designed as a desk reference for architects, historians, and students of spatial design.',
        price: 1250,
        category_slug: 'architecture-heritage',
        category_name: 'Architecture & Heritage',
        cover_path: '/src/assets/images/cover_indian_heritage_1794839639986.jpg',
        sample_pdf: 'sample_architectural_harmony.pdf',
        pages: 312,
        language: 'English',
        binding: 'Hardcover',
        publication_year: 2026,
        stock_quantity: 32,
        is_featured: 1,
        is_new_arrival: 1,
      },
      {
        title: 'Classical Inheritance: Tradition, Society, and the Modern Mind',
        slug: 'classical-inheritance-tradition-society-modern-mind',
        author: 'Elizabeth A. Rutherford & Nicholas J. Finch',
        isbn: '978-93-84102-18-3',
        description:
          'Volume I traces how foundational legal, civic, and philosophical traditions continue to shape modern institutions. Includes annotated primary commentary and an analytical index for university coursework.',
        price: 980,
        category_slug: 'academic-humanities',
        category_name: 'Academic & Humanities',
        cover_path: '/src/assets/images/cover_constitutional_studies_1794839641530.jpg',
        sample_pdf: 'sample_classical_inheritance.pdf',
        pages: 428,
        language: 'English',
        binding: 'Hardcover',
        publication_year: 2026,
        stock_quantity: 24,
        is_featured: 1,
        is_new_arrival: 1,
      },
      {
        title: 'Systems of Advantage: Strategic Thinking and Business Geometry',
        slug: 'systems-of-advantage-strategic-thinking',
        author: 'Evelyn Carter & Marcus Dupont',
        isbn: '978-93-84102-24-4',
        description:
          'A rigorous guide to durable operational moats, capital allocation, and organizational geometry. Built around real structural trade-offs faced by founders and executive teams.',
        price: 890,
        category_slug: 'business-strategy',
        category_name: 'Business & Strategy',
        cover_path: '/src/assets/images/cover_economic_strategy_1794839641883.jpg',
        sample_pdf: 'sample_systems_of_advantage.pdf',
        pages: 276,
        language: 'English',
        binding: 'Hardcover',
        publication_year: 2025,
        stock_quantity: 40,
        is_featured: 1,
        is_new_arrival: 0,
      },
      {
        title: 'Classic Literary Essays: A Collection of Timeless Works',
        slug: 'classic-literary-essays-timeless-works',
        author: 'Edited by A. E. Windsor',
        isbn: '978-93-84102-31-2',
        description:
          'A cloth-bound anthology gathering essential essays on literature, criticism, and the craft of prose. Typeset on archival cream stock with editorial introductions to each selection.',
        price: 750,
        category_slug: 'literature-essays',
        category_name: 'Literature & Essays',
        cover_path: '/src/assets/images/cover_literary_anthology_1794839641789.jpg',
        sample_pdf: 'sample_classic_literary_essays.pdf',
        pages: 344,
        language: 'English',
        binding: 'Hardcover',
        publication_year: 2026,
        stock_quantity: 18,
        is_featured: 0,
        is_new_arrival: 1,
      },
    ];

    const insertBook = db.prepare(`
      INSERT INTO books (
        title, slug, author, isbn, description, price, category_id,
        cover_path, sample_pdf_path, private_pdf_path,
        pages, language, binding, publication_year,
        stock_quantity, is_available, is_featured, is_new_arrival, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, 1, ?, ?, 1)
    `);

    for (const b of seedBooks) {
      const samplePath = path.join(SAMPLE_PDFS_DIR, b.sample_pdf);
      createSamplePdfFile(samplePath, {
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        category: b.category_name,
        description: b.description,
      });

      insertBook.run(
        b.title,
        b.slug,
        b.author,
        b.isbn,
        b.description,
        b.price,
        getCatId(b.category_slug),
        b.cover_path,
        b.sample_pdf,
        b.pages,
        b.language,
        b.binding,
        b.publication_year,
        b.stock_quantity,
        b.is_featured,
        b.is_new_arrival
      );
    }
  }

  // Ensure every published or drafted book author has an Author Profile row
  syncAuthorsFromBooks();

  // Seed initial factual publication updates if empty
  const updateCount = (
    db.prepare(`SELECT COUNT(*) as cnt FROM publication_updates`).get() as { cnt: number }
  ).cnt;
  if (updateCount === 0) {
    const firstBook = db
      .prepare(`SELECT id, title FROM books ORDER BY id ASC LIMIT 1`)
      .get() as { id: number; title: string } | undefined;
    const secondBook = db
      .prepare(`SELECT id, title FROM books ORDER BY id ASC LIMIT 1 OFFSET 1`)
      .get() as { id: number; title: string } | undefined;

    const insertUpdate = db.prepare(`
      INSERT INTO publication_updates (
        title, slug, category, summary, content, related_book_id, is_published, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `);

    if (firstBook) {
      insertUpdate.run(
        `New Hardcover Release: ${firstBook.title}`,
        'new-release-architectural-harmony',
        'new-release',
        'Our latest illustrated hardcover monograph is now available for direct ordering with an interactive chapter preview.',
        `Bhagwati Publications announces the release of "${firstBook.title}". Readers and academic libraries can now inspect the interactive digital preview, verify ISBN-13 specifications, and place direct individual or institutional orders through the storefront.`,
        firstBook.id
      );
    }

    if (secondBook) {
      insertUpdate.run(
        `University Course Adoption: ${secondBook.title}`,
        'course-adoption-classical-inheritance',
        'announcement',
        'Available for bulk university and departmental library acquisitions with dedicated WhatsApp inquiry support.',
        `Institutions and faculty considering "${secondBook.title}" for upcoming semester syllabi can review sample excerpts online and request bulk institutional pricing directly through our Customer Support desk or WhatsApp inquiry channel.`,
        secondBook.id
      );
    }

    insertUpdate.run(
      'Interactive Digital Book Reader & Bilingual Storefront Now Live',
      'interactive-digital-reader-bilingual-storefront',
      'press',
      'Browse our complete catalog in English or Hindi, preview sample pages interactively, and track shipments online.',
      'To serve scholars, libraries, and general readers more effectively, Bhagwati Publications now offers an interactive digital excerpt reader alongside original sample PDFs, bilingual English and Hindi storefront navigation, saved wishlists, and real-time order tracking.',
      null
    );
  }
}

export function ensureUniqueAuthorSlug(name: string, excludeId?: number): string {
  const base = slugify(name);
  let candidate = base;
  let counter = 1;
  while (true) {
    const existing = excludeId
      ? (db.prepare(`SELECT id FROM authors WHERE slug = ? AND id != ?`).get(candidate, excludeId) as
          | { id: number }
          | undefined)
      : (db.prepare(`SELECT id FROM authors WHERE slug = ?`).get(candidate) as
          | { id: number }
          | undefined);
    if (!existing) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

export function syncAuthorsFromBooks(): void {
  const rows = db
    .prepare(`SELECT DISTINCT TRIM(author) as author_name FROM books WHERE TRIM(author) != ''`)
    .all() as Array<{ author_name: string }>;

  const findByName = db.prepare(`SELECT id FROM authors WHERE LOWER(name) = LOWER(?)`);
  const insertAuthor = db.prepare(
    `INSERT INTO authors (name, slug) VALUES (?, ?)`
  );

  for (const r of rows) {
    const existing = findByName.get(r.author_name);
    if (!existing) {
      insertAuthor.run(r.author_name, ensureUniqueAuthorSlug(r.author_name));
    }
  }
}
