'use client';

import { ReactNode } from 'react';
import { PlaybackProvider } from '@/lib/playback-context';
import { TooltipProvider } from '@/components/ui/tooltip';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <PlaybackProvider>
        {children}
      </PlaybackProvider>
    </TooltipProvider>
  );
}
