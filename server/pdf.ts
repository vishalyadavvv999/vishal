import fs from 'node:fs';
import path from 'node:path';

function escapePdfText(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' ');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

export function createSamplePdfFile(
  destPath: string,
  meta: {
    title: string;
    author: string;
    isbn: string;
    category: string;
    description: string;
  }
): void {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const descLines = wrapText(meta.description, 78).slice(0, 10);

  const page1Ops = [
    'BT',
    '/F2 11 Tf',
    '54 740 Td',
    `(BHAGWATI PUBLICATIONS - SAMPLE EDITION PREVIEW) Tj`,
    '0 -38 Td',
    '/F2 22 Tf',
    `(${escapePdfText(meta.title)}) Tj`,
    '0 -26 Td',
    '/F1 13 Tf',
    `(By ${escapePdfText(meta.author)}) Tj`,
    '0 -20 Td',
    '/F1 10 Tf',
    `(Category: ${escapePdfText(meta.category)}   |   ISBN-13: ${escapePdfText(meta.isbn)}) Tj`,
    '0 -32 Td',
    '/F2 12 Tf',
    '(Publisher Synopsis) Tj',
    '0 -18 Td',
    '/F1 11 Tf',
    ...descLines.flatMap((line) => [`(${escapePdfText(line)}) Tj`, '0 -16 Td']),
    '0 -24 Td',
    '/F1 10 Tf',
    '(Note: This is a public sample preview PDF. Full manuscript files remain private.) Tj',
    'ET',
  ].join('\n');

  const page2Ops = [
    'BT',
    '/F2 14 Tf',
    '54 740 Td',
    '(Chapter I — Editorial Excerpt) Tj',
    '0 -28 Td',
    '/F1 11 Tf',
    '(Every enduring volume begins with disciplined editorial craft, archival typography,) Tj',
    '0 -16 Td',
    '(and careful verification of primary sources. Readers evaluating this edition for) Tj',
    '0 -16 Td',
    '(academic adoption, library acquisition, or personal study may contact Bhagwati) Tj',
    '0 -16 Td',
    '(Publications directly via our Support Desk or WhatsApp inquiry channel.) Tj',
    '0 -32 Td',
    '(To order the complete edition, add this title to your shopping bag on the) Tj',
    '0 -16 Td',
    '(book details page or request institutional pricing for bulk quantities.) Tj',
    'ET',
  ].join('\n');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 8 0 R >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `7 0 obj\n<< /Length ${Buffer.byteLength(page1Ops, 'utf8')} >>\nstream\n${page1Ops}\nendstream\nendobj\n`,
    `8 0 obj\n<< /Length ${Buffer.byteLength(page2Ops, 'utf8')} >>\nstream\n${page2Ops}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  fs.writeFileSync(destPath, pdf, 'utf8');
}
