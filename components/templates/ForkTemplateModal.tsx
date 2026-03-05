// components/templates/ForkTemplateModal.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, GitFork, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { templatesService, type TemplateChapter } from '@/lib/templates';
import { type Airline } from '@/lib/chapters';

interface ForkTemplateModalProps {
  template: TemplateChapter;
  airlines?: Airline[]; // Only for SUPER_ADMIN
  onClose: () => void;
  onSuccess?: () => void;
}

export function ForkTemplateModal({ 
  template, 
  airlines,
  onClose, 
  onSuccess 
}: ForkTemplateModalProps) {
  const router = useRouter();
  const [isForking, setIsForking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAirlineId, setSelectedAirlineId] = useState<string>('');

  const handleFork = async () => {
    try {
      setIsForking(true);
      setError(null);

      const data = airlines && selectedAirlineId 
        ? { targetAirlineId: selectedAirlineId }
        : undefined;

      const forkedChapter = await templatesService.forkTemplate(template.id, data);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/manuals/${forkedChapter.id}`);
      }
      
      onClose();
    } catch (err) {
      console.error('Error forking template:', err);
      setError(err instanceof Error ? err.message : 'Failed to fork template');
    } finally {
      setIsForking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <GitFork className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Fork Template</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Create a copy of &quot;{template.title}&quot; for your airline
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isForking}
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

          {/* Template Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Template:</span>
                <span className="font-medium text-gray-900">{template.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Source Airline:</span>
                <span className="font-medium text-gray-900">
                  {template.airline.name} ({template.airline.code})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sections:</span>
                <span className="font-medium text-gray-900">
                  {template._count?.sections || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-medium text-gray-900">
                  v{template.templateVersion}
                </span>
              </div>
            </div>
          </div>

          {/* Airline Selection (SUPER_ADMIN only) */}
          {airlines && airlines.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Airline <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAirlineId}
                onChange={(e) => setSelectedAirlineId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isForking}
              >
                <option value="">Select an airline</option>
                {airlines.map((airline) => (
                  <option key={airline.id} value={airline.id}>
                    {airline.name} ({airline.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Warning */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This will create a complete copy of the template including all sections and content. 
              You can modify your copy independently, and you&apos;ll be notified when the original template is updated.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 justify-end">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isForking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFork}
              disabled={isForking || (!!airlines && !selectedAirlineId)}
            >
              {isForking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Forking...
                </>
              ) : (
                <>
                  <GitFork className="w-4 h-4 mr-2" />
                  Fork Template
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}