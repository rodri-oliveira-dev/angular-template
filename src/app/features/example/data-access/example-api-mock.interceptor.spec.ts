import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { provideApiConfig } from '../../../core/config/api.config';
import { correlationIdInterceptor } from '../../../core/http/correlation-id.interceptor';
import { httpErrorInterceptor } from '../../../core/http/http-error.interceptor';
import { ExampleApiClient } from './example-api-client';
import { exampleApiMockInterceptor } from './example-api-mock.interceptor';

describe('exampleApiMockInterceptor', () => {
  function configure(useLocalMock = true, basePath = '/api'): void {
    TestBed.configureTestingModule({
      providers: [
        provideApiConfig({
          basePath,
          useLocalMock,
        }),
        provideHttpClient(
          withInterceptors([
            correlationIdInterceptor,
            httpErrorInterceptor,
            exampleApiMockInterceptor,
          ]),
        ),
        provideHttpClientTesting(),
      ],
    });
  }

  beforeEach(() => {
    configure();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('supports local GET and POST flows without an external API', async () => {
    const client = TestBed.inject(ExampleApiClient);

    const initialItems = await firstValueFrom(client.list());
    const created = await firstValueFrom(client.create('Local write'));
    const updatedItems = await firstValueFrom(client.list());

    expect(initialItems.length).toBe(2);
    expect(created.label).toBe('Local write');
    expect(updatedItems).toHaveLength(3);
  });

  it('passes non-mock URLs through to the backend', () => {
    const httpClient = TestBed.inject(HttpClient);
    const httpTestingController = TestBed.inject(HttpTestingController);

    httpClient.get('/api/health').subscribe();

    const request = httpTestingController.expectOne('/api/health');
    request.flush({ status: 'ok' });
  });

  it('passes unsupported methods through to the backend', () => {
    const httpClient = TestBed.inject(HttpClient);
    const httpTestingController = TestBed.inject(HttpTestingController);

    httpClient.put('/api/examples', { name: 'Updated' }).subscribe();

    const request = httpTestingController.expectOne('/api/examples');
    expect(request.request.method).toBe('PUT');
    request.flush({});
  });

  it('returns a normalized validation error for an invalid create request', async () => {
    const httpClient = TestBed.inject(HttpClient);

    await expect(
      firstValueFrom(
        httpClient.post('/api/examples', {
          name: '   ',
        }),
      ),
    ).rejects.toMatchObject({
      status: 400,
      message: 'The example name is required.',
    });
  });

  it('can be disabled so requests reach the real backend adapter', () => {
    TestBed.resetTestingModule();
    configure(false);

    const httpClient = TestBed.inject(HttpClient);
    const httpTestingController = TestBed.inject(HttpTestingController);

    httpClient.get('/api/examples').subscribe();

    const request = httpTestingController.expectOne('/api/examples');
    request.flush([]);
  });

  it('normalizes a trailing slash in the configured base path', async () => {
    TestBed.resetTestingModule();
    configure(true, '/api/');

    const client = TestBed.inject(ExampleApiClient);
    const items = await firstValueFrom(client.list());

    expect(items).toHaveLength(2);
  });
});
