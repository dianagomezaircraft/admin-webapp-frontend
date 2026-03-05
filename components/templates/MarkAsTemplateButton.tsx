// components/templates/MarkAsTemplateButton.tsx
'use client';

import { useState } from 'react';
import { FileCode, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { templatesService } from '@/lib/templates';

interface MarkAsTemplateButtonProps {
  chapterId: string;
  isTemplate: boolean;
  isForked: boolean;
  onSuccess?: () => void;
}

export function MarkAsTemplateButton({ 
  chapterId, 
  isTemplate, 
  isForked,
  onSuccess 
}: MarkAsTemplateButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show button if already a template or is forked
  if (isTemplate || isForked) {
    return null;
  }

  const handleMarkAsTemplate = async () => {
    try {
      setIsMarking(true);
      setError(null);
      await templatesService.markAsTemplate(chapterId);
      
      if (onSuccess) {
        onSuccess();
      }
      
      setShowConfirm(false);
    } catch (err) {
      console.error('Error marking as template:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as template');
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="border-purple-200 text-purple-700 hover:bg-purple-50"
      >
        <FileCode className="w-4 h-4 mr-2" />
        Mark as Template
      </Button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileCode className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Mark as Template
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    This will make this chapter available for other airlines to fork
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Info Box */}
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="text-sm font-medium text-purple-900 mb-2">
                  What happens when you mark this as template:
                </h4>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Other airlines can create copies (forks) of this chapter</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Your original chapter remains unchanged</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>When you update this template, forked versions will be notified</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Each fork can maintain its own customizations</span>
                  </li>
                </ul>
              </div>

              {/* Warning */}
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> This action cannot be easily undone. Make sure this chapter is ready to be shared.
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowConfirm(false);
                    setError(null);
                  }}
                  disabled={isMarking}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMarkAsTemplate}
                  disabled={isMarking}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isMarking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <FileCode className="w-4 h-4 mr-2" />
                      Mark as Template
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}