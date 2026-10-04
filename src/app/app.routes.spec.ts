import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ExampleApiClient } from './features/example/data-access/example-api-client';
import { routes } from './app.routes';

describe('application routes', () => {
  const apiClient = {
    list: vi.fn(() => of([])),
    create: vi.fn(),
  };

  beforeEach(() => {
    apiClient.list.mockClear();
    apiClient.create.mockClear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: ExampleApiClient,
          useValue: apiClient,
        },
      ],
    });
  });

  it('lazy loads the example feature route', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/example');

    expect(TestBed.inject(Router).url).toBe('/example');
    expect(harness.routeNativeElement?.textContent).toContain('Feature-first by default');
    expect(apiClient.list).toHaveBeenCalledOnce();
  });

  it('redirects the root route to the example feature', async () => {
    await RouterTestingHarness.create('/');

    expect(TestBed.inject(Router).url).toBe('/example');
  });

  it('redirects unknown routes to the example feature', async () => {
    await RouterTestingHarness.create('/missing');

    expect(TestBed.inject(Router).url).toBe('/example');
  });
});
