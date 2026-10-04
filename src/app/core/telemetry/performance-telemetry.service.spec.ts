import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Component } from '@angular/core';
import { vi } from 'vitest';

import { PERFORMANCE_RUNTIME, PerformanceRuntime } from './performance-runtime';
import {
  NAVIGATION_TELEMETRY_EVENT,
  PerformanceTelemetryService,
  WEB_VITAL_TELEMETRY_EVENT,
} from './performance-telemetry.service';
import { TelemetryClient } from './telemetry.client';
import { TELEMETRY_CONFIG } from './telemetry.provider';

@Component({
  template: 'home',
})
class HomePage {}

describe('PerformanceTelemetryService', () => {
  function configure(
    enabled: boolean,
    runtime: PerformanceRuntime,
    telemetry: { event: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> },
  ): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'home/:id',
            component: HomePage,
          },
        ]),
        PerformanceTelemetryService,
        {
          provide: TelemetryClient,
          useValue: telemetry,
        },
        {
          provide: TELEMETRY_CONFIG,
          useValue: {
            enabled: true,
            mode: 'local',
            performance: {
              enabled,
            },
          },
        },
        {
          provide: PERFORMANCE_RUNTIME,
          useValue: runtime,
        },
      ],
    });
  }

  it('does nothing when performance telemetry is disabled', async () => {
    const telemetry = {
      event: vi.fn(),
      error: vi.fn(),
    };
    const runtime: PerformanceRuntime = {
      now: vi.fn(() => 10),
      observe: vi.fn(() => null),
      onPageHide: vi.fn(() => null),
    };

    configure(false, runtime, telemetry);
    TestBed.inject(PerformanceTelemetryService).start();

    await RouterTestingHarness.create('/home/123');

    expect(runtime.observe).not.toHaveBeenCalled();
    expect(runtime.onPageHide).not.toHaveBeenCalled();
    expect(telemetry.event).not.toHaveBeenCalled();
  });

  it('records navigation with a route pattern instead of the concrete URL', async () => {
    let currentTime = 100;
    const telemetry = {
      event: vi.fn(),
      error: vi.fn(),
    };
    const runtime: PerformanceRuntime = {
      now: vi.fn(() => {
        currentTime += 25;
        return currentTime;
      }),
      observe: vi.fn(() => null),
      onPageHide: vi.fn(() => null),
    };

    configure(true, runtime, telemetry);
    TestBed.inject(PerformanceTelemetryService).start();

    await RouterTestingHarness.create('/home/secret-user-id');

    expect(TestBed.inject(Router).url).toBe('/home/secret-user-id');
    expect(telemetry.event).toHaveBeenCalledWith(
      NAVIGATION_TELEMETRY_EVENT,
      expect.objectContaining({
        outcome: 'success',
        routePattern: '/home/:id',
        durationMs: expect.any(Number),
      }),
    );
    expect(JSON.stringify(telemetry.event.mock.calls)).not.toContain('secret-user-id');
  });

  it('flushes selected Web Vitals on page hide', () => {
    const callbacks = new Map<string, (entries: readonly PerformanceEntry[]) => void>();
    let onPageHide: (() => void) | undefined;
    const telemetry = {
      event: vi.fn(),
      error: vi.fn(),
    };
    const runtime: PerformanceRuntime = {
      now: vi.fn(() => 1),
      observe: vi.fn((type, callback) => {
        callbacks.set(type, callback);
        return () => undefined;
      }),
      onPageHide: vi.fn((callback) => {
        onPageHide = callback;
        return () => undefined;
      }),
    };

    configure(true, runtime, telemetry);
    TestBed.inject(PerformanceTelemetryService).start();

    callbacks.get('largest-contentful-paint')?.([
      {
        startTime: 1234.4,
      } as PerformanceEntry,
    ]);
    callbacks.get('layout-shift')?.([
      {
        value: 0.12,
        hadRecentInput: false,
      } as PerformanceEntry & { value: number; hadRecentInput: boolean },
      {
        value: 0.5,
        hadRecentInput: true,
      } as PerformanceEntry & { value: number; hadRecentInput: boolean },
    ]);

    onPageHide?.();

    expect(telemetry.event).toHaveBeenCalledWith(WEB_VITAL_TELEMETRY_EVENT, {
      metric: 'LCP',
      value: 1234,
      unit: 'ms',
    });
    expect(telemetry.event).toHaveBeenCalledWith(WEB_VITAL_TELEMETRY_EVENT, {
      metric: 'CLS',
      value: 0.12,
      unit: 'score',
    });
  });
});
