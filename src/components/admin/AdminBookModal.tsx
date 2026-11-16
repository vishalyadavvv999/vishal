import { useState } from 'react';
import { FileCheck2, Lock, Upload, X } from 'lucide-react';
import type { Book, Category } from '../../types';
import { api } from '../../lib/api';

interface AdminBookModalProps {
  open: boolean;
  editingBook: Book | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export function AdminBookModal({
  open,
  editingBook,
  categories,
  onClose,
  onSaved,
}: AdminBookModalProps) {
  const [title, setTitle] = useState(editingBook?.title || '');
  const [author, setAuthor] = useState(editingBook?.author || '');
  const [isbn, setIsbn] = useState(editingBook?.isbn || '');
  const [description, setDescription] = useState(editingBook?.description || '');
  const [price, setPrice] = useState(editingBook ? String(editingBook.price) : '');
  const [categoryId, setCategoryId] = useState(
    editingBook?.category_id ? String(editingBook.category_id) : categories[0]?.id ? String(categories[0].id) : ''
  );
  const [pages, setPages] = useState(editingBook?.pages ? String(editingBook.pages) : '240');
  const [language, setLanguage] = useState(editingBook?.language || 'English');
  const [binding, setBinding] = useState(editingBook?.binding || 'Hardcover');
  const [publicationYear, setPublicationYear] = useState(
    editingBook?.publication_year ? String(editingBook.publication_year) : String(new Date().getFullYear())
  );
  const [stockQuantity, setStockQuantity] = useState(
    editingBook ? String(editingBook.stock_quantity) : '25'
  );
  const [isAvailable, setIsAvailable] = useState(editingBook ? editingBook.is_available : true);
  const [isFeatured, setIsFeatured] = useState(editingBook ? editingBook.is_featured : false);
  const [isNewArrival, setIsNewArrival] = useState(editingBook ? editingBook.is_new_arrival : true);
  const [isPublished, setIsPublished] = useState(editingBook ? editingBook.is_published : true);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [samplePdfFile, setSamplePdfFile] = useState<File | null>(null);
  const [privatePdfFile, setPrivatePdfFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('author', author.trim());
      formData.append('isbn', isbn.trim());
      formData.append('description', description.trim());
      formData.append('price', price);
      if (categoryId) formData.append('category_id', categoryId);
      formData.append('pages', pages || '0');
      formData.append('language', language.trim());
      formData.append('binding', binding.trim());
      formData.append('publication_year', publicationYear || String(new Date().getFullYear()));
      formData.append('stock_quantity', stockQuantity || '0');
      formData.append('is_available', String(isAvailable));
      formData.append('is_featured', String(isFeatured));
      formData.append('is_new_arrival', String(isNewArrival));
      formData.append('is_published', String(isPublished));

      if (coverFile) formData.append('cover', coverFile);
      if (samplePdfFile) formData.append('sample_pdf', samplePdfFile);
      if (privatePdfFile) formData.append('private_pdf', privatePdfFile);

      if (editingBook) {
        await api.adminUpdateBook(editingBook.id, formData);
      } else {
        await api.adminCreateBook(formData);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save book');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111E]/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-3xl my-auto overflow-hidden">
        <div className="px-6 py-4 bg-[#0B192C] text-white flex items-center justify-between">
          <h2 id="book-modal-title" className="font-serif text-lg font-semibold">
            {editingBook ? `Edit Book: ${editingBook.title}` : 'Publish New Book'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close book form"
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Book Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Author *</label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ISBN-13 *</label>
              <input
                type="text"
                required
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-93-..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:border-[#0B192C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono tabular-nums focus:border-[#0B192C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Stock Qty *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono tabular-nums focus:border-[#0B192C] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 sm:col-span-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Pages</label>
                <input
                  type="number"
                  min="1"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono tabular-nums focus:border-[#0B192C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Language</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Binding</label>
                <select
                  value={binding}
                  onChange={(e) => setBinding(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
                >
                  <option value="Hardcover">Hardcover</option>
                  <option value="Paperback">Paperback</option>
                  <option value="Digital Edition">Digital Edition</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Year</label>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={publicationYear}
                  onChange={(e) => setPublicationYear(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono tabular-nums focus:border-[#0B192C] focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Book Description *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-[#0B192C] focus:outline-none"
              />
            </div>
          </div>

          {/* Secure File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
            <div className="p-3.5 border border-slate-200 rounded-md bg-slate-50 space-y-2">
              <label className="block text-xs font-semibold text-[#0B192C]">
                Cover Image (JPG/PNG/WEBP)
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{coverFile ? 'Change Image' : 'Choose Cover'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-500 truncate">
                {coverFile
                  ? coverFile.name
                  : editingBook?.cover_url
                    ? 'Existing cover retained'
                    : 'Optional'}
              </p>
            </div>

            <div className="p-3.5 border border-slate-200 rounded-md bg-slate-50 space-y-2">
              <label className="block text-xs font-semibold text-[#0B192C]">
                Public Sample PDF
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{samplePdfFile ? 'Change Sample' : 'Upload Sample PDF'}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setSamplePdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-500 truncate">
                {samplePdfFile
                  ? samplePdfFile.name
                  : editingBook?.has_sample_pdf
                    ? 'Sample PDF uploaded'
                    : 'Publicly previewable'}
              </p>
            </div>

            <div className="p-3.5 border border-slate-200 rounded-md bg-slate-50 space-y-2">
              <label className="flex items-center gap-1 text-xs font-semibold text-[#0B192C]">
                <Lock className="w-3.5 h-3.5 text-[#9F7918]" />
                <span>Private Full PDF</span>
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{privatePdfFile ? 'Change Private PDF' : 'Upload Private PDF'}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPrivatePdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-500 truncate">
                {privatePdfFile
                  ? privatePdfFile.name
                  : editingBook?.has_private_pdf
                    ? 'Private PDF stored securely'
                    : 'Never exposed publicly'}
              </p>
            </div>
          </div>

          {/* Visibility & Merchandise Flags */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-[#0B192C]"
              />
              <span className="font-medium text-slate-700">Published</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="accent-[#0B192C]"
              />
              <span className="font-medium text-slate-700">Available to Order</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-[#0B192C]"
              />
              <span className="font-medium text-slate-700">Featured Edition</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={(e) => setIsNewArrival(e.target.checked)}
                className="accent-[#0B192C]"
              />
              <span className="font-medium text-slate-700">New Arrival</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#0B192C] text-white text-sm font-semibold rounded-md hover:bg-[#132642] transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Saving...' : editingBook ? 'Save Changes' : 'Publish Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
