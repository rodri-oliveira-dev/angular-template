import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PERFORMANCE_RUNTIME } from './performance-runtime';

describe('PERFORMANCE_RUNTIME', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('uses the browser performance clock and manages pagehide listeners', () => {
    const runtime = TestBed.inject(PERFORMANCE_RUNTIME);
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const removeEventListener = vi.spyOn(window, 'removeEventListener');
    const callback = vi.fn();

    expect(runtime.now()).toEqual(expect.any(Number));

    const stop = runtime.onPageHide(callback);

    expect(addEventListener).toHaveBeenCalledWith('pagehide', callback);

    stop?.();

    expect(removeEventListener).toHaveBeenCalledWith('pagehide', callback);
  });

  it('skips unsupported performance entry types', () => {
    class UnsupportedPerformanceObserver {
      static readonly supportedEntryTypes = ['resource'];
    }

    vi.stubGlobal('PerformanceObserver', UnsupportedPerformanceObserver);
    TestBed.resetTestingModule();

    const runtime = TestBed.inject(PERFORMANCE_RUNTIME);

    expect(runtime.observe('layout-shift', vi.fn())).toBeNull();
  });

  it('skips observation when PerformanceObserver is unavailable', () => {
    vi.stubGlobal('PerformanceObserver', undefined);
    TestBed.resetTestingModule();

    const runtime = TestBed.inject(PERFORMANCE_RUNTIME);

    expect(runtime.observe('largest-contentful-paint', vi.fn())).toBeNull();
  });

  it('forwards observed entries and disconnects the observer', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let observerCallback: PerformanceObserverCallback | undefined;

    class SupportedPerformanceObserver {
      static readonly supportedEntryTypes = ['largest-contentful-paint'];

      constructor(callback: PerformanceObserverCallback) {
        observerCallback = callback;
      }

      observe = observe;
      disconnect = disconnect;
    }

    vi.stubGlobal('PerformanceObserver', SupportedPerformanceObserver);
    TestBed.resetTestingModule();

    const runtime = TestBed.inject(PERFORMANCE_RUNTIME);
    const callback = vi.fn();
    const entries = [{ startTime: 123 }] as PerformanceEntry[];
    const stop = runtime.observe('largest-contentful-paint', callback);

    expect(observe).toHaveBeenCalledWith({
      type: 'largest-contentful-paint',
      buffered: true,
    });

    observerCallback?.(
      {
        getEntries: () => entries,
      } as PerformanceObserverEntryList,
      {} as PerformanceObserver,
    );

    expect(callback).toHaveBeenCalledWith(entries);

    stop?.();

    expect(disconnect).toHaveBeenCalledOnce();
  });
});
