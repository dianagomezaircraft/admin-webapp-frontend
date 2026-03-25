// components/templates/TemplateSyncPanel.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Radio,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { templatesService, type TemplateChapter, type ForkSyncStatus, type TemplateSyncData } from '@/lib/templates';

interface TemplateSyncPanelProps {
  templates: TemplateChapter[];
}

type PushStatus = 'idle' | 'pushing' | 'done';

interface PushResult {
  succeeded: string[];
  failed: { forkId: string; error: string }[];
}

interface TemplateRow {
  template: TemplateChapter;
  syncData: TemplateSyncData | null;
  isLoading: boolean;
  isExpanded: boolean;
  pushStatus: PushStatus;
  pushResult: PushResult | null;
  error: string | null;
}

export function TemplateSyncPanel({ templates }: TemplateSyncPanelProps) {
  const [rows, setRows] = useState<TemplateRow[]>(() =>
    templates.map((t) => ({
      template: t,
      syncData: null,
      isLoading: false,
      isExpanded: false,
      pushStatus: 'idle',
      pushResult: null,
      error: null,
    }))
  );

  // Sync rows when templates prop changes
  useEffect(() => {
    setRows((prev) => {
      const prevMap = new Map(prev.map((r) => [r.template.id, r]));
      return templates.map((t) => {
        const existing = prevMap.get(t.id);
        return existing ? { ...existing, template: t } : {
          template: t,
          syncData: null,
          isLoading: false,
          isExpanded: false,
          pushStatus: 'idle' as PushStatus,
          pushResult: null,
          error: null,
        };
      });
    });
  }, [templates]);

  const updateRow = (templateId: string, patch: Partial<TemplateRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.template.id === templateId ? { ...r, ...patch } : r))
    );
  };

  const loadSyncData = useCallback(async (templateId: string) => {
    updateRow(templateId, { isLoading: true, error: null });
    try {
      const data = await templatesService.getTemplateSyncStatus(templateId);
      updateRow(templateId, { syncData: data, isLoading: false });
    } catch (err) {
      updateRow(templateId, {
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load sync status',
      });
    }
  }, []);

  const toggleExpand = (templateId: string) => {
    const row = rows.find((r) => r.template.id === templateId);
    if (!row) return;

    if (!row.isExpanded && !row.syncData && !row.isLoading) {
      loadSyncData(templateId);
    }

    updateRow(templateId, { isExpanded: !row.isExpanded });
  };

  const handlePushAll = async (templateId: string) => {
    updateRow(templateId, { pushStatus: 'pushing', pushResult: null });
    try {
      const result = await templatesService.pushToAllForks(templateId);
      updateRow(templateId, { pushStatus: 'done', pushResult: result });
      // Refresh sync data after push
      await loadSyncData(templateId);
    } catch (err) {
      updateRow(templateId, {
        pushStatus: 'idle',
        error: err instanceof Error ? err.message : 'Push failed',
      });
    }
  };

  const handlePushSelected = async (templateId: string, forkIds: string[]) => {
    updateRow(templateId, { pushStatus: 'pushing', pushResult: null });
    try {
      const result = await templatesService.pushToAllForks(templateId, forkIds);
      updateRow(templateId, { pushStatus: 'done', pushResult: result });
      await loadSyncData(templateId);
    } catch (err) {
      updateRow(templateId, {
        pushStatus: 'idle',
        error: err instanceof Error ? err.message : 'Push failed',
      });
    }
  };

  // Filter to only templates that have forks
  const relevantRows = rows.filter((r) => (r.template._count?.forkedChapters ?? 0) > 0);

  if (relevantRows.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Radio className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Sync Status
        </h3>
        <span className="text-xs text-gray-400">· SUPER_ADMIN only</span>
      </div>

      <div className="space-y-2">
        {relevantRows.map((row) => (
          <TemplateSyncRow
            key={row.template.id}
            row={row}
            onToggle={() => toggleExpand(row.template.id)}
            onPushAll={() => handlePushAll(row.template.id)}
            onPushSelected={(ids) => handlePushSelected(row.template.id, ids)}
            onRefresh={() => loadSyncData(row.template.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Per-template row ──────────────────────────────────────────────────────────

interface TemplateSyncRowProps {
  row: TemplateRow;
  onToggle: () => void;
  onPushAll: () => void;
  onPushSelected: (forkIds: string[]) => void;
  onRefresh: () => void;
}

function TemplateSyncRow({
  row,
  onToggle,
  onPushAll,
  onPushSelected,
  onRefresh,
}: TemplateSyncRowProps) {
  const [selectedForks, setSelectedForks] = useState<Set<string>>(new Set());
  const { template, syncData, isLoading, isExpanded, pushStatus, pushResult, error } = row;

  const outdatedCount = syncData?.outdatedCount ?? 0;
  const totalForks = template._count?.forkedChapters ?? 0;
  const isPushing = pushStatus === 'pushing';

  const toggleFork = (id: string) => {
    setSelectedForks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const outdatedForks = syncData?.forks.filter((f) => f.isOutdated) ?? [];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center space-x-3 min-w-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-gray-900 truncate">
            {template.title}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">
            v{template.templateVersion}
          </span>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : syncData ? (
            outdatedCount > 0 ? (
              <span className="flex items-center space-x-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                <span>{outdatedCount} outdated</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>All synced</span>
              </span>
            )
          ) : (
            <span className="text-xs text-gray-400">{totalForks} forks</span>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={onRefresh} className="text-red-600 hover:text-red-800 ml-2">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="px-4 py-6 flex items-center justify-center space-x-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading fork status...</span>
            </div>
          )}

          {/* Push result banner */}
          {pushResult && (
            <div className={`px-4 py-3 text-sm flex items-center space-x-2 ${
              pushResult.failed.length === 0
                ? 'bg-green-50 text-green-700'
                : 'bg-yellow-50 text-yellow-700'
            }`}>
              {pushResult.failed.length === 0 ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>
                {pushResult.succeeded.length} synced successfully
                {pushResult.failed.length > 0 && `, ${pushResult.failed.length} failed`}
              </span>
            </div>
          )}

          {/* Fork list */}
          {syncData && !isLoading && (
            <>
              {syncData.forks.length === 0 ? (
                <div className="px-4 py-4 text-sm text-gray-500 text-center">
                  No forks found
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {syncData.forks.map((fork) => (
                    <ForkStatusRow
                      key={fork.id}
                      fork={fork}
                      templateVersion={syncData.template.templateVersion}
                      isSelected={selectedForks.has(fork.id)}
                      onToggle={() => toggleFork(fork.id)}
                      isPushing={isPushing}
                      pushResult={pushResult}
                    />
                  ))}
                </div>
              )}

              {/* Footer actions */}
              {outdatedForks.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {selectedForks.size > 0
                      ? `${selectedForks.size} selected`
                      : `${outdatedForks.length} outdated fork${outdatedForks.length > 1 ? 's' : ''}`}
                  </span>
                  <div className="flex items-center space-x-2">
                    {selectedForks.size > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onPushSelected(Array.from(selectedForks))}
                        disabled={isPushing}
                      >
                        {isPushing ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3 mr-1" />
                        )}
                        Sync selected ({selectedForks.size})
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={onPushAll}
                      disabled={isPushing}
                    >
                      {isPushing ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3 mr-1" />
                      )}
                      Sync all outdated
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Per-fork row ──────────────────────────────────────────────────────────────

interface ForkStatusRowProps {
  fork: ForkSyncStatus;
  templateVersion: number;
  isSelected: boolean;
  onToggle: () => void;
  isPushing: boolean;
  pushResult: PushResult | null;
}

function ForkStatusRow({
  fork,
  templateVersion,
  isSelected,
  onToggle,
  isPushing,
  pushResult,
}: ForkStatusRowProps) {
  const wasSucceeded = pushResult?.succeeded.includes(fork.id);
  const wasFailed = pushResult?.failed.find((f) => f.forkId === fork.id);

  return (
    <div
      className={`flex items-center px-4 py-2.5 space-x-3 transition-colors ${
        fork.isOutdated ? 'hover:bg-gray-50 cursor-pointer' : ''
      } ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={fork.isOutdated ? onToggle : undefined}
    >
      {/* Checkbox — only for outdated forks */}
      <div className="flex-shrink-0 w-5">
        {fork.isOutdated && !isPushing && !wasSucceeded ? (
          <div
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}
          >
            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
        ) : null}
      </div>

      {/* Airline info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {fork.airline.name}
        </p>
        <p className="text-xs text-gray-400">
          {fork.airline.code} · Fork v{fork.forkVersion}
          {fork.lastSyncedAt && (
            <> · Synced {new Date(fork.lastSyncedAt).toLocaleDateString()}</>
          )}
        </p>
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        {isPushing && fork.isOutdated && !wasSucceeded ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        ) : wasSucceeded ? (
          <span className="flex items-center space-x-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <Check className="w-3 h-3" />
            <span>Synced</span>
          </span>
        ) : wasFailed ? (
          <span className="flex items-center space-x-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <X className="w-3 h-3" />
            <span>Failed</span>
          </span>
        ) : fork.isOutdated ? (
          <span className="flex items-center space-x-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            <span>v{fork.forkVersion} → v{templateVersion}</span>
          </span>
        ) : (
          <span className="flex items-center space-x-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>Up to date</span>
          </span>
        )}
      </div>
    </div>
  );
}