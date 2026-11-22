import { useCallback, useEffect, useState } from 'react';
import { Check, Edit3, Newspaper, Plus, Trash2, UserCheck } from 'lucide-react';
import type { AuthorProfile, Book, PublicationUpdate, UpdateCategory } from '../../types';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/currency';

interface AdminEditorialTabProps {
  books: Book[];
  onStorefrontDataChanged: () => void;
}

export function AdminEditorialTab({ books, onStorefrontDataChanged }: AdminEditorialTabProps) {
  const [subTab, setSubTab] = useState<'authors' | 'updates'>('updates');
  const [authors, setAuthors] = useState<AuthorProfile[]>([]);
  const [updates, setUpdates] = useState<PublicationUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Author Editor state
  const [editingAuthor, setEditingAuthor] = useState<AuthorProfile | null>(null);
  const [authorCredentials, setAuthorCredentials] = useState('');
  const [authorAffiliation, setAuthorAffiliation] = useState('');
  const [authorLocation, setAuthorLocation] = useState('');
  const [authorBio, setAuthorBio] = useState('');
  const [savingAuthor, setSavingAuthor] = useState(false);

  // Update Editor state
  const [editingUpdateId, setEditingUpdateId] = useState<number | null>(null);
  const [upTitle, setUpTitle] = useState('');
  const [upCategory, setUpCategory] = useState<UpdateCategory>('announcement');
  const [upSummary, setUpSummary] = useState('');
  const [upContent, setUpContent] = useState('');
  const [upBookId, setUpBookId] = useState<string>('');
  const [upPublished, setUpPublished] = useState(true);
  const [savingUpdate, setSavingUpdate] = useState(false);

  const loadEditorialData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [authList, updList] = await Promise.all([
        api.adminGetAuthors(),
        api.adminGetUpdates(),
      ]);
      setAuthors(authList);
      setUpdates(updList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load editorial data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEditorialData();
  }, [loadEditorialData]);

  const startEditAuthor = (author: AuthorProfile) => {
    setEditingAuthor(author);
    setAuthorCredentials(author.credentials || '');
    setAuthorAffiliation(author.affiliation || '');
    setAuthorLocation(author.location || '');
    setAuthorBio(author.bio || '');
    setStatusMsg('');
  };

  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAuthor) return;
    setSavingAuthor(true);
    setError('');
    try {
      await api.adminUpdateAuthor(editingAuthor.id, {
        credentials: authorCredentials.trim(),
        affiliation: authorAffiliation.trim(),
        location: authorLocation.trim(),
        bio: authorBio.trim(),
      });
      setEditingAuthor(null);
      setStatusMsg('Author profile saved.');
      await loadEditorialData();
      onStorefrontDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update author profile');
    } finally {
      setSavingAuthor(false);
    }
  };

  const resetUpdateForm = () => {
    setEditingUpdateId(null);
    setUpTitle('');
    setUpCategory('announcement');
    setUpSummary('');
    setUpContent('');
    setUpBookId('');
    setUpPublished(true);
  };

  const startEditUpdate = (upd: PublicationUpdate) => {
    setEditingUpdateId(upd.id);
    setUpTitle(upd.title);
    setUpCategory(upd.category);
    setUpSummary(upd.summary);
    setUpContent(upd.content);
    setUpBookId(upd.related_book_id ? String(upd.related_book_id) : '');
    setUpPublished(upd.is_published);
    setStatusMsg('');
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upTitle.trim() || !upSummary.trim() || !upContent.trim()) return;
    setSavingUpdate(true);
    setError('');
    try {
      const payload = {
        title: upTitle.trim(),
        category: upCategory,
        summary: upSummary.trim(),
        content: upContent.trim(),
        related_book_id: upBookId ? Number(upBookId) : null,
        is_published: upPublished,
      };
      if (editingUpdateId) {
        await api.adminUpdateUpdate(editingUpdateId, payload);
        setStatusMsg('Publication update saved.');
      } else {
        await api.adminCreateUpdate(payload);
        setStatusMsg('New publication update created.');
      }
      resetUpdateForm();
      await loadEditorialData();
      onStorefrontDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save publication update');
    } finally {
      setSavingUpdate(false);
    }
  };

  const handleDeleteUpdate = async (id: number) => {
    try {
      await api.adminDeleteUpdate(id);
      if (editingUpdateId === id) resetUpdateForm();
      await loadEditorialData();
      onStorefrontDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete update');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#0B192C]">
            Authors & Publication Updates
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Maintain verified author biographies and publish official press notices or new release dispatches.
          </p>
        </div>

        <div className="inline-flex p-1 bg-white border border-slate-200 rounded-md self-start">
          <button
            type="button"
            onClick={() => setSubTab('updates')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
              subTab === 'updates'
                ? 'bg-[#0B192C] text-white'
                : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>News & Updates ({updates.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('authors')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
              subTab === 'authors'
                ? 'bg-[#0B192C] text-white'
                : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Author Profiles ({authors.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md">
          {error}
        </div>
      )}
      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-md flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg animate-pulse" />
      ) : subTab === 'updates' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveUpdate}
            className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4 h-fit"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-base font-bold text-[#0B192C]">
                {editingUpdateId ? 'Edit Publication Update' : 'Publish New Update'}
              </h3>
              {editingUpdateId && (
                <button
                  type="button"
                  onClick={resetUpdateForm}
                  className="text-xs text-slate-500 hover:text-[#0B192C] cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Headline *
              </label>
              <input
                type="text"
                required
                value={upTitle}
                onChange={(e) => setUpTitle(e.target.value)}
                placeholder="e.g. New Hardcover Release Available"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={upCategory}
                  onChange={(e) => setUpCategory(e.target.value as UpdateCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white"
                >
                  <option value="new-release">New Release</option>
                  <option value="announcement">Announcement</option>
                  <option value="event">Event & Fair</option>
                  <option value="press">Press & Platform</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Linked Book (Optional)
                </label>
                <select
                  value={upBookId}
                  onChange={(e) => setUpBookId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white"
                >
                  <option value="">None</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Short Summary *
              </label>
              <textarea
                required
                rows={2}
                value={upSummary}
                onChange={(e) => setUpSummary(e.target.value)}
                placeholder="Concise two-line overview for the homepage and updates feed..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Dispatch Content *
              </label>
              <textarea
                required
                rows={4}
                value={upContent}
                onChange={(e) => setUpContent(e.target.value)}
                placeholder="Complete announcement or editorial note..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={upPublished}
                onChange={(e) => setUpPublished(e.target.checked)}
                className="accent-[#0B192C]"
              />
              <span>Publish immediately on public News & Updates page</span>
            </label>

            <button
              type="submit"
              disabled={savingUpdate}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#0B192C] text-white text-xs font-semibold rounded-md hover:bg-[#132642] disabled:opacity-60 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#DFC166]" />
              <span>
                {savingUpdate
                  ? 'Saving...'
                  : editingUpdateId
                    ? 'Save Changes'
                    : 'Publish Update'}
              </span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200">
              <h3 className="font-serif text-base font-bold text-[#0B192C]">
                Published & Draft Dispatches
              </h3>
            </div>
            {updates.length === 0 ? (
              <p className="p-8 text-sm text-slate-500 text-center">
                No publication updates created yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {updates.map((upd) => (
                  <div key={upd.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500">
                        <span className="uppercase text-[#9F7918] font-semibold">
                          {upd.category}
                        </span>
                        <span>·</span>
                        <span>{formatDate(upd.published_at)}</span>
                        <span>·</span>
                        <span>{upd.is_published ? 'Published' : 'Draft'}</span>
                      </div>
                      <p className="font-serif text-base font-bold text-[#0B192C]">{upd.title}</p>
                      <p className="text-xs text-slate-600 line-clamp-2">{upd.summary}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditUpdate(upd)}
                        className="p-1.5 text-slate-600 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                        title="Edit update"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUpdate(upd.id)}
                        className="p-1.5 text-rose-700 border border-slate-200 rounded hover:bg-rose-50 cursor-pointer"
                        title="Delete update"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200">
              <h3 className="font-serif text-base font-bold text-[#0B192C]">
                Synced Catalog Authors ({authors.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {authors.map((auth) => (
                <div key={auth.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-serif text-base font-bold text-[#0B192C]">{auth.name}</p>
                      <span className="text-xs font-mono text-slate-500 tabular-nums">
                        ({auth.book_count} {auth.book_count === 1 ? 'book' : 'books'})
                      </span>
                    </div>
                    {auth.credentials && (
                      <p className="text-xs font-medium text-[#9F7918]">{auth.credentials}</p>
                    )}
                    <p className="text-xs text-slate-600">
                      {[auth.affiliation, auth.location].filter(Boolean).join(' · ') ||
                        'No institutional affiliation added'}
                    </p>
                    {auth.bio && (
                      <p className="text-xs text-slate-500 line-clamp-2 pt-0.5">{auth.bio}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditAuthor(auth)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-[#0B192C] hover:bg-slate-50 shrink-0 cursor-pointer"
                  >
                    Edit Profile
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            {editingAuthor ? (
              <form
                onSubmit={handleSaveAuthor}
                className="bg-white border border-slate-200 rounded-lg p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-base font-bold text-[#0B192C]">
                    Edit Profile: {editingAuthor.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingAuthor(null)}
                    className="text-xs text-slate-500 hover:text-[#0B192C] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Credentials / Designation
                  </label>
                  <input
                    type="text"
                    value={authorCredentials}
                    onChange={(e) => setAuthorCredentials(e.target.value)}
                    placeholder="e.g. Professor of Architectural History"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Affiliation / Institution
                  </label>
                  <input
                    type="text"
                    value={authorAffiliation}
                    onChange={(e) => setAuthorAffiliation(e.target.value)}
                    placeholder="e.g. Institute of Urban Design"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={authorLocation}
                    onChange={(e) => setAuthorLocation(e.target.value)}
                    placeholder="e.g. New Delhi, India"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Author Biography
                  </label>
                  <textarea
                    rows={4}
                    value={authorBio}
                    onChange={(e) => setAuthorBio(e.target.value)}
                    placeholder="Author academic or editorial background..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingAuthor}
                  className="w-full py-2.5 bg-[#0B192C] text-white text-xs font-semibold rounded-md hover:bg-[#132642] disabled:opacity-60 cursor-pointer"
                >
                  {savingAuthor ? 'Saving...' : 'Save Author Profile'}
                </button>
              </form>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-6 text-center space-y-2">
                <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-[#0B192C]">Select an Author to Edit</p>
                <p className="text-xs text-slate-600">
                  Author records sync automatically whenever books are published or updated. Select any author on the left to update their credentials and public biography.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
