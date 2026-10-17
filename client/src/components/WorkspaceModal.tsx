import React, { useState } from 'react';
import { X, Briefcase, Plus } from 'lucide-react';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkspace: (data: { name: string; description: string; systemPrompt: string }) => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ isOpen, onClose, onCreateWorkspace }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    onCreateWorkspace({
      name: name.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
    });

    setName('');
    setDescription('');
    setSystemPrompt('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">Create New Workspace</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Workspace Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Python DevOps Specialist"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this workspace is tailored for"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">System Instructions (Role Definition) *</label>
            <textarea
              required
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define instructions, tone, constraints, and expertise for the AI model in this workspace..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !systemPrompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Workspace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
