'use client';

import * as React from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';

import type { ResetResult } from '@/actions/result';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

/**
 * Dialog reset password oleh admin: konfirmasi -> password sementara tampil SEKALI.
 * Render hanya saat ada target; komponen ini selalu terbuka dan memanggil onClose saat selesai.
 */
export function ResetPasswordDialog({
  name,
  noun,
  onReset,
  onClose,
}: {
  name: string;
  noun: 'student' | 'teacher';
  onReset: () => Promise<ResetResult>;
  onClose: () => void;
}) {
  const [phase, setPhase] = React.useState<'confirm' | 'working' | 'done'>('confirm');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const run = async () => {
    setPhase('working');
    setError('');
    try {
      const result = await onReset();
      if (result.ok) {
        setPassword(result.password);
        setPhase('done');
      } else {
        setError(result.error);
        setPhase('confirm');
      }
    } catch {
      setError('Network error. Please try again.');
      setPhase('confirm');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false); // clipboard tidak tersedia: admin menyalin manual dari kotak di atas
    }
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && phase !== 'working' && onClose()}>
      <AlertDialogContent>
        {phase === 'done' ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Password reset</AlertDialogTitle>
              <AlertDialogDescription>
                Give this temporary password to {name}. It is shown only once, and {name} must
                change it at the next login.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className='flex items-center gap-2 rounded-lg border bg-muted/50 p-3'>
              <code
                className='flex-1 font-mono text-base tracking-wide select-all'
                data-testid='temp-password'
              >
                {password}
              </code>
              <Button variant='outline' size='icon-sm' onClick={copy} aria-label='Copy password'>
                {copied ? <CheckIcon /> : <CopyIcon />}
              </Button>
            </div>
            <AlertDialogFooter>
              <Button onClick={onClose}>Done</Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset password for {name}?</AlertDialogTitle>
              <AlertDialogDescription>
                A new temporary password will be generated and the current password stops working
                immediately. The {noun} must set a new password at the next login.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {error && (
              <p
                role='alert'
                className='rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive'
              >
                {error}
              </p>
            )}
            <AlertDialogFooter>
              <Button variant='outline' disabled={phase === 'working'} onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={phase === 'working'} onClick={run}>
                {phase === 'working' && <Spinner />}
                {phase === 'working' ? 'Resetting...' : 'Reset Password'}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
