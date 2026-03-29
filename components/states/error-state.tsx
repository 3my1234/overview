'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorState({
  title,
  message,
  onRetry,
  onDismiss,
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">{message}</AlertDescription>
      </Alert>
      <div className="mt-6 flex gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            Retry
          </Button>
        )}
        {onDismiss && (
          <Button onClick={onDismiss} variant="outline">
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}
