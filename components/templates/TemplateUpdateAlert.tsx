// components/templates/TemplateUpdateAlert.tsx
'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { templatesService, type UpdateCheckResult } from '@/lib/templates';

interface TemplateUpdateAlertProps {
  chapterId: string;
  onReviewClick?: () => void;
}

export function TemplateUpdateAlert({ chapterId, onReviewClick }: TemplateUpdateAlertProps) {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkForUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  const checkForUpdates = async () => {
    try {
      setIsChecking(true);
      setError(null);
      const result = await templatesService.checkForUpdates(chapterId);
      setUpdateInfo(result);
    } catch (err) {
      console.error('Error checking for updates:', err);
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

  // Don't show if dismissed, no updates, or still checking
  if (isDismissed || !updateInfo?.hasUpdates || isChecking) {
    return null;
  }

  if (error) {
    return null; // Silently fail
  }

  const { changes } = updateInfo;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-blue-900">
              Template Update Available
            </h4>
            <p className="text-sm text-blue-800 mt-1">
              The template &quot;{changes?.templateTitle}&quot; has been updated to version {changes?.latestVersion}.
              You&apos;re currently on version {changes?.currentVersion}.
            </p>
            {onReviewClick && (
              <Button
                size="sm"
                onClick={onReviewClick}
                className="mt-3"
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Review Changes
              </Button>
            )}
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}