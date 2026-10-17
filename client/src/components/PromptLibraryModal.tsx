import React, { useState } from 'react';
import { X, BookOpen, Search, Plus, Trash2, ArrowRight } from 'lucide-react';
import { PromptTemplate } from '../types';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: PromptTemplate[];
  onSelectPrompt: (content: string) => void;
  onCreatePrompt: (prompt: Omit<PromptTemplate, 'id'>) => void;
  onDeletePrompt: (id: string) => void;
}

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  prompts,
  onSelectPrompt,
  onCreatePrompt,
  onDeletePrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<PromptTemplate['category']>('Coding');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  if (!isOpen) return null;

  const categories = ['All', 'Coding', 'Writing', 'Productivity', 'Brainstorming', 'Analysis'];

  const filtered = prompts.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    onCreatePrompt({
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      content: newContent.trim(),
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setNewTitle('');
    setNewDesc('');
    setNewContent('');
    setNewTags('');
    setActiveTab('browse');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Prompt Template Library</h3>
              <p className="text-xs text-slate-400">Ready-to-use prompts for accelerated workflows</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-0.5 rounded-lg bg-slate-950 border border-slate-800">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'browse' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Browse ({prompts.length})
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'create' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                + New Template
              </button>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeTab === 'browse' ? (
          <>
            {/* Search & Categories */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates or keywords..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-md shrink-0 transition-colors ${
                      selectedCategory === cat
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-400">
                  No matching templates found.
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-850 text-slate-400 shrink-0">
                          {item.category}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                        {item.description}
                      </p>

                      <pre className="p-2.5 rounded bg-slate-900 border border-slate-850 text-[10px] text-slate-300 font-mono line-clamp-3 mb-3">
                        {item.content}
                      </pre>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-850/80">
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.tags.map((t, idx) => (
                          <span key={idx} className="text-[9px] text-slate-500">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.id.startsWith('p-') && !['p-1', 'p-2', 'p-3', 'p-4'].includes(item.id) && (
                          <button
                            onClick={() => onDeletePrompt(item.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete prompt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onSelectPrompt(item.content);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                        >
                          <span>Use</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleCreate} className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Unit Test Generator"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Coding">Coding</option>
                  <option value="Writing">Writing</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Brainstorming">Brainstorming</option>
                  <option value="Analysis">Analysis</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What does this prompt achieve?"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Prompt Content *</label>
              <textarea
                required
                rows={5}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write the full template text with placeholders like [code] or [topic]..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="testing, jest, typescript"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className="px-4 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Back to Browse
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Template</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
