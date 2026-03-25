// components/templates/BulkForkTemplatesModal.tsx
'use client';

import { useState, useMemo } from 'react';
import { X, GitFork, Search, Loader2, Check, AlertCircle, Square, CheckSquare, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { templatesService, type TemplateChapter } from '@/lib/templates';
import { type Airline } from '@/lib/chapters';

interface BulkForkTemplatesModalProps {
  templates: TemplateChapter[];
  airlines?: Airline[]; // Only for SUPER_ADMIN
  isSuperAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ForkStatus = 'idle' | 'loading' | 'success' | 'error';

interface ForkResult {
  template: TemplateChapter;
  status: ForkStatus;
  error?: string;
  forkedId?: string;
}

export function BulkForkTemplatesModal({
  templates,
  airlines,
  isSuperAdmin,
  onClose,
  onSuccess,
}: BulkForkTemplatesModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedAirlineId, setSelectedAirlineId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<ForkResult[] | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.airline.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }, [templates, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((t) => selected.has(t.id));

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((t) => next.add(t.id));
        return next;
      });
    }
  };

  const handleFork = async () => {
    if (selected.size === 0) return;
    if (isSuperAdmin && !selectedAirlineId) return;

    setIsSubmitting(true);

    const selectedTemplates = templates.filter((t) => selected.has(t.id));

    // Initialize results as loading
    setResults(
      selectedTemplates.map((t) => ({ template: t, status: 'loading' }))
    );

    const forkData = isSuperAdmin && selectedAirlineId
      ? { targetAirlineId: selectedAirlineId }
      : undefined;

    // Fork all in parallel
    const settled = await Promise.allSettled(
      selectedTemplates.map((t) => templatesService.forkTemplate(t.id, forkData))
    );

    const finalResults: ForkResult[] = selectedTemplates.map((t, i) => {
      const result = settled[i];
      if (result.status === 'fulfilled') {
        return {
          template: t,
          status: 'success',
          forkedId: result.value.id,
        };
      } else {
        return {
          template: t,
          status: 'error',
          error:
            result.reason instanceof Error
              ? result.reason.message
              : 'Failed to fork',
        };
      }
    });

    setResults(finalResults);
    setIsSubmitting(false);

    // If all succeeded, notify parent to refresh
    const allSucceeded = finalResults.every((r) => r.status === 'success');
    if (allSucceeded) onSuccess();
  };

  const successResults = results?.filter((r) => r.status === 'success') ?? [];
  const errorResults = results?.filter((r) => r.status === 'error') ?? [];
  const isDone = results !== null && !isSubmitting;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        <CardContent className="p-0 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 2rem)' }}>

          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <GitFork className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isDone ? 'Fork Results' : 'Fork Templates'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isDone
                    ? `${successResults.length} succeeded · ${errorResults.length} failed`
                    : 'Select templates to fork into your airline'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── SELECTION VIEW ── */}
          {!isDone && (
            <>
              {/* Search + Select All + Airline picker */}
              <div className="px-6 pt-4 pb-3 space-y-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>

                {/* SUPER_ADMIN airline selector */}
                {isSuperAdmin && airlines && airlines.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Target Airline <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedAirlineId}
                      onChange={(e) => setSelectedAirlineId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="">Select target airline</option>
                      {airlines.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleAll}
                    disabled={filtered.length === 0 || isSubmitting}
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span>{allFilteredSelected ? 'Deselect all' : 'Select all'}</span>
                  </button>
                  <span className="text-sm text-gray-500">
                    {selected.size} of {templates.length} selected
                  </span>
                </div>
              </div>

              {/* Template list — scrollable, bounded */}
              <div className="overflow-y-auto px-6 py-4 space-y-2" style={{ maxHeight: '340px' }}>
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No templates match your search
                  </div>
                ) : (
                  filtered.map((template) => {
                    const isSelected = selected.has(template.id);
                    return (
                      <button
                        key={template.id}
                        onClick={() => toggleOne(template.id)}
                        disabled={isSubmitting}
                        className={`w-full text-left flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        } disabled:cursor-default`}
                      >
                        {/* Checkbox */}
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded border-2 border-gray-300" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {template.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {template.airline.name} · v{template.templateVersion} · {template._count?.sections ?? 0} sections
                          </p>
                        </div>

                        {/* Forks badge */}
                        <div className="flex-shrink-0 text-xs text-gray-400">
                          {template._count?.forkedChapters ?? 0} forks
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* ── RESULTS VIEW ── */}
          {isDone && results && (
            <div className="overflow-y-auto px-6 py-4 space-y-2" style={{ maxHeight: '400px' }}>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{successResults.length}</p>
                  <p className="text-xs text-green-600 mt-1">Forked successfully</p>
                </div>
                <div className={`border rounded-lg p-3 text-center ${errorResults.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-2xl font-bold ${errorResults.length > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                    {errorResults.length}
                  </p>
                  <p className={`text-xs mt-1 ${errorResults.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>Failed</p>
                </div>
              </div>

              {/* Per-item results */}
              {results.map((r) => (
                <div
                  key={r.template.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    r.status === 'success'
                      ? 'border-green-200 bg-green-50'
                      : r.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {r.status === 'loading' ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : r.status === 'success' ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>

                  {/* Template info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {r.template.title}
                    </p>
                    {r.status === 'error' && r.error && (
                      <p className="text-xs text-red-600 mt-0.5">{r.error}</p>
                    )}
                    {r.status === 'success' && (
                      <p className="text-xs text-green-600 mt-0.5">Forked successfully</p>
                    )}
                  </div>

                  {/* Link to forked chapter */}
                  {r.status === 'success' && r.forkedId && (
                    <button
                      onClick={() => router.push(`/dashboard/manuals/${r.forkedId}`)}
                      className="flex-shrink-0 flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer — always visible, never scrolls */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white rounded-b-lg">
            <p className="text-sm text-gray-500 mr-4 min-w-0 truncate">
              {isDone
                ? errorResults.length > 0
                  ? 'Some forks failed. Retry from templates page.'
                  : 'All templates forked successfully!'
                : selected.size === 0
                ? 'Select at least one template'
                : `${selected.size} template${selected.size > 1 ? 's' : ''} will be forked`}
            </p>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                {isDone ? 'Close' : 'Cancel'}
              </Button>
              {!isDone && (
                <Button
                  onClick={handleFork}
                  disabled={
                    selected.size === 0 ||
                    isSubmitting ||
                    (isSuperAdmin && !selectedAirlineId)
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Forking...
                    </>
                  ) : (
                    <>
                      <GitFork className="w-4 h-4 mr-2" />
                      Fork {selected.size > 1 ? `${selected.size} Templates` : 'Template'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}