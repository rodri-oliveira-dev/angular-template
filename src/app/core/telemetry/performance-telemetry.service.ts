import { DestroyRef, Injectable, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TelemetryClient } from './telemetry.client';
import { PERFORMANCE_RUNTIME } from './performance-runtime';
import { TELEMETRY_CONFIG } from './telemetry.provider';

export const NAVIGATION_TELEMETRY_EVENT = 'navigation.completed';
export const WEB_VITAL_TELEMETRY_EVENT = 'performance.web_vital';

@Injectable()
export class PerformanceTelemetryService {
  private readonly router = inject(Router);
  private readonly telemetry = inject(TelemetryClient);
  private readonly config = inject(TELEMETRY_CONFIG);
  private readonly runtime = inject(PERFORMANCE_RUNTIME);
  private readonly destroyRef = inject(DestroyRef);

  private readonly navigationStartedAt = new Map<number, number>();
  private readonly stopObservers: Array<() => void> = [];
  private latestLcpMs: number | null = null;
  private clsObserverInstalled = false;
  private clsSessionStartMs: number | null = null;
  private clsPreviousEntryMs: number | null = null;
  private clsSessionValue = 0;
  private maxClsSessionValue = 0;
  private started = false;
  private flushedVitals = false;

  start(): void {
    if (this.started || !this.config.enabled || !this.config.performance?.enabled) {
      return;
    }

    this.started = true;

    if (this.config.performance.navigation !== false) {
      this.observeNavigation();
    }

    if (this.config.performance.webVitals !== false) {
      this.observeWebVitals();
    }

    this.destroyRef.onDestroy(() => {
      for (const stop of this.stopObservers.splice(0)) {
        stop();
      }
    });
  }

  private observeNavigation(): void {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.navigationStartedAt.set(event.id, this.runtime.now());
        return;
      }

      if (event instanceof NavigationEnd) {
        this.recordNavigation(event.id, 'success', routePattern(this.router));
        return;
      }

      if (event instanceof NavigationCancel) {
        this.recordNavigation(event.id, 'cancelled');
        return;
      }

      if (event instanceof NavigationError) {
        this.recordNavigation(event.id, 'error');
      }
    });
  }

  private recordNavigation(
    id: number,
    outcome: 'success' | 'cancelled' | 'error',
    pattern?: string,
  ): void {
    const startedAt = this.navigationStartedAt.get(id);

    if (startedAt === undefined) {
      return;
    }

    this.navigationStartedAt.delete(id);

    this.telemetry.event(NAVIGATION_TELEMETRY_EVENT, {
      outcome,
      durationMs: Math.max(0, Math.round(this.runtime.now() - startedAt)),
      routePattern: pattern,
    });
  }

  private observeWebVitals(): void {
    const stopLcp = this.runtime.observe('largest-contentful-paint', (entries) => {
      const last = entries.at(-1);

      if (last) {
        this.latestLcpMs = last.startTime;
      }
    });

    if (stopLcp) {
      this.stopObservers.push(stopLcp);
    }

    const stopCls = this.runtime.observe('layout-shift', (entries) => {
      for (const entry of entries) {
        const layoutShift = entry as PerformanceEntry & {
          readonly value?: number;
          readonly hadRecentInput?: boolean;
        };

        if (!layoutShift.hadRecentInput && typeof layoutShift.value === 'number') {
          this.recordClsEntry(layoutShift.startTime, layoutShift.value);
        }
      }
    });

    if (stopCls) {
      this.clsObserverInstalled = true;
      this.stopObservers.push(stopCls);
    }

    if (stopLcp || stopCls) {
      const stopPageHide = this.runtime.onPageHide(() => this.flushWebVitals());

      if (stopPageHide) {
        this.stopObservers.push(stopPageHide);
      }
    }
  }

  private flushWebVitals(): void {
    if (this.flushedVitals) {
      return;
    }

    this.flushedVitals = true;

    if (this.latestLcpMs !== null) {
      this.telemetry.event(WEB_VITAL_TELEMETRY_EVENT, {
        metric: 'LCP',
        value: Math.round(this.latestLcpMs),
        unit: 'ms',
      });
    }

    if (this.clsObserverInstalled) {
      this.telemetry.event(WEB_VITAL_TELEMETRY_EVENT, {
        metric: 'CLS',
        value: Number(this.maxClsSessionValue.toFixed(4)),
        unit: 'score',
      });
    }
  }

  private recordClsEntry(startTime: number, value: number): void {
    const continuesCurrentWindow =
      this.clsSessionStartMs !== null &&
      this.clsPreviousEntryMs !== null &&
      startTime - this.clsPreviousEntryMs < 1_000 &&
      startTime - this.clsSessionStartMs < 5_000;

    if (continuesCurrentWindow) {
      this.clsSessionValue += value;
    } else {
      this.clsSessionStartMs = startTime;
      this.clsSessionValue = value;
    }

    this.clsPreviousEntryMs = startTime;
    this.maxClsSessionValue = Math.max(this.maxClsSessionValue, this.clsSessionValue);
  }
}

function routePattern(router: Router): string {
  const segments: string[] = [];
  let snapshot = router.routerState.snapshot.root;

  while (snapshot.firstChild) {
    snapshot = snapshot.firstChild;
    const path = snapshot.routeConfig?.path;

    if (path) {
      segments.push(path);
    }
  }

  return segments.length > 0 ? `/${segments.join('/')}` : '/';
}
