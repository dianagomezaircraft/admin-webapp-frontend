// components/templates/ReviewUpdatesModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Check, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { templatesService, type TemplateUpdate } from '@/lib/templates';

interface ReviewUpdatesModalProps {
  chapterId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewUpdatesModal({ 
  chapterId, 
  onClose, 
  onSuccess 
}: ReviewUpdatesModalProps) {
  const [updates, setUpdates] = useState<TemplateUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  const loadUpdates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await templatesService.getPendingUpdates(chapterId);
      setUpdates(data);
    } catch (err) {
      console.error('Error loading updates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load updates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (updateId: string) => {
    try {
      setProcessingId(updateId);
      setError(null);
      await templatesService.applyUpdate(updateId);
      
      // Remove the applied update from the list
      setUpdates(prev => prev.filter(u => u.id !== updateId));
      
      if (onSuccess) {
        onSuccess();
      }

      // Close modal if no more updates
      if (updates.length <= 1) {
        onClose();
      }
    } catch (err) {
      console.error('Error applying update:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply update');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (updateId: string) => {
    try {
      setProcessingId(updateId);
      setError(null);
      await templatesService.rejectUpdate(updateId);
      
      // Remove the rejected update from the list
      setUpdates(prev => prev.filter(u => u.id !== updateId));
      
      // Close modal if no more updates
      if (updates.length <= 1) {
        onClose();
      }
    } catch (err) {
      console.error('Error rejecting update:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject update');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardContent className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Review Template Updates</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isLoading ? 'Loading...' : `${updates.length} pending ${updates.length === 1 ? 'update' : 'updates'}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={!!processingId}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          )}

          {/* No Updates */}
          {!isLoading && updates.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600">No pending updates</p>
            </div>
          )}

          {/* Updates List */}
          {!isLoading && updates.length > 0 && (
            <div className="flex-1 overflow-y-auto space-y-4">
              {updates.map((update) => (
                <div 
                  key={update.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  {/* Update Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Template: {update.template?.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Version {update.template?.templateVersion}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                      Pending
                    </span>
                  </div>

                  {/* Changes */}
                  <div className="bg-gray-50 rounded p-3 mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">Changes:</p>
                    <div className="space-y-1 text-sm">
                      {update.changes.title && (
                        <div className="flex items-start">
                          <span className="text-gray-600 min-w-[80px]">Title:</span>
                          <span className="text-gray-900 font-medium">{update.changes.title}</span>
                        </div>
                      )}
                      {update.changes.description !== undefined && (
                        <div className="flex items-start">
                          <span className="text-gray-600 min-w-[80px]">Description:</span>
                          <span className="text-gray-900">
                            {update.changes.description || '(removed)'}
                          </span>
                        </div>
                      )}
                      {update.changes.imageUrl !== undefined && (
                        <div className="flex items-start">
                          <span className="text-gray-600 min-w-[80px]">Image:</span>
                          <span className="text-gray-900">
                            {update.changes.imageUrl ? 'Updated' : 'Removed'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <Button
                      size="sm"
                      onClick={() => handleApply(update.id)}
                      disabled={!!processingId}
                      className="flex-1"
                    >
                      {processingId === update.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 mr-2" />
                          Apply Changes
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleReject(update.id)}
                      disabled={!!processingId}
                      className="flex-1 text-red-600 hover:bg-red-50"
                    >
                      {processingId === update.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {!isLoading && updates.length > 0 && (
            <div className="mt-4 pt-4 border-t flex justify-end">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={!!processingId}
              >
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}