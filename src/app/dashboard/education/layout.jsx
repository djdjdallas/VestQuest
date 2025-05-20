"use client";

import { lazy, Suspense } from 'react';
import { EducationLevelProvider } from '@/context/EducationContext';
import { UserProgressProvider } from '@/components/education/UserProgressProvider';
import { Loader2 } from 'lucide-react';

export default function EducationLayout({ children }) {
  return (
    <EducationLevelProvider>
      <UserProgressProvider>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg text-muted-foreground">Loading education center...</span>
          </div>
        }>
          {children}
        </Suspense>
      </UserProgressProvider>
    </EducationLevelProvider>
  );
}