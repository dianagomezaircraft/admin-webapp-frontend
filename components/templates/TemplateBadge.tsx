// components/templates/TemplateBadge.tsx
'use client';

import { GitFork, FileCode } from 'lucide-react';

interface TemplateBadgeProps {
  isTemplate: boolean;
  isForked: boolean;
  templateName?: string;
  className?: string;
}

export function TemplateBadge({ 
  isTemplate, 
  isForked, 
  templateName,
  className = '' 
}: TemplateBadgeProps) {
  if (isTemplate) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ${className}`}>
        <FileCode className="w-3 h-3 mr-1" />
        Template
      </span>
    );
  }

  if (isForked && templateName) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}>
        <GitFork className="w-3 h-3 mr-1" />
        Forked from {templateName}
      </span>
    );
  }

  return null;
}