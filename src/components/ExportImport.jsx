import { useState } from 'react';
import { useStore, ACTIONS } from '../store/useStore.js';

export default function ExportImport({ onClose }) {
  const { state, dispatch } = useStore();
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState(null);

  const handleExport = () => {
    const data = {
      version: 'routinequest_v1',
      exportedAt: new Date().toISOString(),
      profile: state.profile,
      habits: state.habits,
      achievements: state.achievements,
      journalEntries: state.journalEntries || [],
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routinequest-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Backup downloaded!' });
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      if (!data.version || !data.habits) {
        setMessage({ type: 'error', text: 'Invalid backup file format.' });
        return;
      }
      // Restore state by directly writing to localStorage and reloading
      const toSave = {
        profile: data.profile || state.profile,
        habits: data.habits,
        achievements: data.achievements || [],
        journalEntries: data.journalEntries || [],
        settings: state.settings,
      };
      localStorage.setItem('routineTracker_v3', JSON.stringify(toSave));
      setMessage({ type: 'success', text: 'Import successful! Reloading...' });
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to parse backup: ' + e.message });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-[#1f1f1f] shadow-2xl animate-slide-up overflow-hidden"
        style={{ background: 'var(--bg-card)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#1f1f1f]">
          <div>
            <h2 className="text-white font-bold text-lg">Backup & Restore</h2>
            <p className="text-[#4b5563] text-xs mt-0.5">Export your data as JSON or restore from backup</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-[#4b5563] hover:text-white flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-border)' }}
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {message && (
            <div
              className="p-3 rounded-xl text-sm font-medium"
              style={{
                background: message.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)',
                color: message.type === 'success' ? '#22c55e' : '#f87171',
                border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.3)'}`,
              }}
            >
              {message.text}
            </div>
          )}

          {/* Export */}
          <div>
            <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider mb-2">Export</p>
            <button
              onClick={handleExport}
              className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              ↓ Download Backup
            </button>
            <p className="text-[#4b5563] text-xs mt-1.5 text-center">
              {state.habits.length} habits · {state.achievements.length} achievements
            </p>
          </div>

          {/* Import */}
          <div>
            <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-wider mb-2">Restore</p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Paste your backup JSON here..."
              className="w-full h-24 bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-3 py-2.5 text-white text-xs font-mono outline-none resize-none placeholder-[#374151]"
            />
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}
            >
              ↑ Restore from Backup
            </button>
            <p className="text-[#4b5563] text-[10px] mt-1.5 text-center">
              ⚠ This will overwrite your current data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
