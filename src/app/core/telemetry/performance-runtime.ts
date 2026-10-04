import { InjectionToken } from '@angular/core';

export interface PerformanceRuntime {
  now(): number;
  observe(
    type: string,
    callback: (entries: readonly PerformanceEntry[]) => void,
  ): (() => void) | null;
  onPageHide(callback: () => void): (() => void) | null;
}

export const PERFORMANCE_RUNTIME = new InjectionToken<PerformanceRuntime>(
  'PERFORMANCE_RUNTIME',
  {
    factory: () => ({
      now: () => globalThis.performance?.now?.() ?? Date.now(),
      observe: (type, callback) => {
        if (
          typeof PerformanceObserver === 'undefined' ||
          !PerformanceObserver.supportedEntryTypes?.includes(type)
        ) {
          return null;
        }

        const observer = new PerformanceObserver((list) => {
          callback(list.getEntries());
        });

        observer.observe({
          type,
          buffered: true,
        });

        return () => observer.disconnect();
      },
      onPageHide: (callback) => {
        if (typeof window === 'undefined') {
          return null;
        }

        window.addEventListener('pagehide', callback);

        return () => window.removeEventListener('pagehide', callback);
      },
    }),
  },
);
