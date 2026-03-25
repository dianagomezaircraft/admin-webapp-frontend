// components/templates/MarkAsTemplateModal.tsx
'use client';

import { useState, useMemo } from 'react';
import { X, FileCode, Search, Loader2, CheckSquare, Square, AlertCircle, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { templatesService } from '@/lib/templates';
import { type Chapter } from '@/lib/chapters';

interface MarkAsTemplateModalProps {
  chapters: Chapter[];
  onClose: () => void;
  onSuccess: () => void;
}

type ChapterStatus = 'idle' | 'loading' | 'success' | 'error';

export function MarkAsTemplateModal({
  chapters,
  onClose,
  onSuccess,
}: MarkAsTemplateModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chapterStatuses, setChapterStatuses] = useState<Record<string, ChapterStatus>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Only show chapters that are NOT already templates
  const eligibleChapters = useMemo(
    () => chapters.filter((c) => !c.isTemplate),
    [chapters]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return eligibleChapters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [eligibleChapters, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.id));

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
        filtered.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;

    setIsSubmitting(true);
    setGlobalError(null);

    // Initialize all selected as loading
    const initialStatuses: Record<string, ChapterStatus> = {};
    selected.forEach((id) => (initialStatuses[id] = 'loading'));
    setChapterStatuses(initialStatuses);

    // Call mark-as-template for each selected chapter in parallel
    const results = await Promise.allSettled(
      Array.from(selected).map((id) => templatesService.markAsTemplate(id))
    );

    const updatedStatuses: Record<string, ChapterStatus> = {};
    let hasError = false;

    Array.from(selected).forEach((id, i) => {
      if (results[i].status === 'fulfilled') {
        updatedStatuses[id] = 'success';
      } else {
        updatedStatuses[id] = 'error';
        hasError = true;
      }
    });

    setChapterStatuses(updatedStatuses);
    setIsSubmitting(false);
    setDone(true);

    if (!hasError) {
      // All succeeded — auto close after short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } else {
      setGlobalError('Some chapters could not be marked as templates. See details below.');
    }
  };

  const successCount = Object.values(chapterStatuses).filter((s) => s === 'success').length;
  const errorCount = Object.values(chapterStatuses).filter((s) => s === 'error').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileCode className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mark as Templates</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Select chapters to publish as reusable templates
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

          {/* Search + Select All */}
          <div className="px-6 pt-4 pb-3 space-y-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search chapters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isSubmitting || done}
              />
            </div>

            {!done && (
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleAll}
                  disabled={filtered.length === 0 || isSubmitting}
                  className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>{allFilteredSelected ? 'Deselect all' : 'Select all'}</span>
                </button>
                <span className="text-sm text-gray-500">
                  {selected.size} of {eligibleChapters.length} selected
                </span>
              </div>
            )}
          </div>

          {/* Global error */}
          {globalError && (
            <div className="mx-6 mt-4 flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          {/* Results summary after submit */}
          {done && (
            <div className="mx-6 mt-4 flex items-center space-x-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm">
              {successCount > 0 && (
                <span className="flex items-center space-x-1 text-green-700 font-medium">
                  <Check className="w-4 h-4" />
                  <span>{successCount} succeeded</span>
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center space-x-1 text-red-600 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorCount} failed</span>
                </span>
              )}
            </div>
          )}

          {/* Chapter List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {eligibleChapters.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileCode className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">All chapters are already templates</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No chapters match your search
              </div>
            ) : (
              filtered.map((chapter) => {
                const isSelected = selected.has(chapter.id);
                const status = chapterStatuses[chapter.id];

                return (
                  <button
                    key={chapter.id}
                    onClick={() => !done && !isSubmitting && toggleOne(chapter.id)}
                    disabled={isSubmitting || done}
                    className={`w-full text-left flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                      status === 'success'
                        ? 'border-green-200 bg-green-50'
                        : status === 'error'
                        ? 'border-red-200 bg-red-50'
                        : isSelected
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    } disabled:cursor-default`}
                  >
                    {/* Checkbox / Status Icon */}
                    <div className="flex-shrink-0">
                      {status === 'loading' ? (
                        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                      ) : status === 'success' ? (
                        <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : status === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : isSelected ? (
                        <div className="w-5 h-5 rounded border-2 border-purple-500 bg-purple-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border-2 border-gray-300" />
                      )}
                    </div>

                    {/* Chapter info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {chapter.title}
                      </p>
                      {chapter.description && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {chapter.description}
                        </p>
                      )}
                    </div>

                    {/* Sections count */}
                    <div className="flex-shrink-0 text-xs text-gray-400">
                      {chapter._count?.sections ?? 0} sections
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {done
                ? errorCount > 0
                  ? 'You can close this and retry failed chapters'
                  : 'All done!'
                : selected.size === 0
                ? 'Select at least one chapter'
                : `${selected.size} chapter${selected.size > 1 ? 's' : ''} will be marked as templates`}
            </p>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                {done ? 'Close' : 'Cancel'}
              </Button>
              {!done && (
                <Button
                  onClick={handleSubmit}
                  disabled={selected.size === 0 || isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileCode className="w-4 h-4 mr-2" />
                      Mark as Template{selected.size > 1 ? 's' : ''}
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