import {
  HttpClient,
  HttpXsrfTokenExtractor,
  provideHttpClient,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  BFF_XSRF_HEADER_NAME,
  bffXsrfFeature,
} from './bff-session-security';

describe('BFF session security', () => {
  let client: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(bffXsrfFeature),
        provideHttpClientTesting(),
        {
          provide: HttpXsrfTokenExtractor,
          useValue: {
            getToken: () => 'test-xsrf-token',
          },
        },
      ],
    });

    client = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('adds the XSRF header to same-origin write requests without forcing credentials', () => {
    client.post('/api/examples', { name: 'example' }).subscribe();

    const request = httpTestingController.expectOne('/api/examples');

    expect(request.request.headers.get(BFF_XSRF_HEADER_NAME)).toBe('test-xsrf-token');
    expect(request.request.withCredentials).toBe(false);

    request.flush({});
  });

  it('does not add the XSRF header to safe same-origin requests', () => {
    client.get('/api/examples').subscribe();

    const request = httpTestingController.expectOne('/api/examples');

    expect(request.request.headers.has(BFF_XSRF_HEADER_NAME)).toBe(false);
    expect(request.request.withCredentials).toBe(false);

    request.flush([]);
  });

  it('does not add the XSRF header or credentials to cross-origin write requests', () => {
    client.post('https://api.example.test/examples', { name: 'example' }).subscribe();

    const request = httpTestingController.expectOne('https://api.example.test/examples');

    expect(request.request.headers.has(BFF_XSRF_HEADER_NAME)).toBe(false);
    expect(request.request.withCredentials).toBe(false);

    request.flush({});
  });
});
