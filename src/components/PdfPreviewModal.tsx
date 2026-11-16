import { ExternalLink, FileText, X } from 'lucide-react';
import type { Book } from '../types';

interface PdfPreviewModalProps {
  book: Book | null;
  onClose: () => void;
}

export function PdfPreviewModal({ book, onClose }: PdfPreviewModalProps) {
  if (!book) return null;

  const pdfUrl = `/api/books/${book.id}/sample-pdf`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111E]/75 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-title"
    >
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 bg-[#0B192C] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-[#DFC166] shrink-0" />
            <div className="min-w-0">
              <h2 id="pdf-preview-title" className="font-serif text-base sm:text-lg font-semibold truncate">
                Sample Preview — {book.title}
              </h2>
              <p className="text-xs text-slate-300 truncate">
                {book.author} · ISBN {book.isbn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#DFC166] border border-[#DFC166]/40 rounded hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open PDF</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sample preview"
              className="p-2 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 relative">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            title={`Sample PDF preview for ${book.title}`}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
