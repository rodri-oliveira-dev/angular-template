import { TestBed } from '@angular/core/testing';

import { API_CONFIG, normalizeSameOriginBasePath, provideApiConfig } from './api.config';

describe('API configuration', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('normalizes a trailing slash and preserves the selected mode', () => {
    TestBed.configureTestingModule({
      providers: [
        provideApiConfig({
          basePath: '/gateway/',
          mode: 'bff',
        }),
      ],
    });

    expect(TestBed.inject(API_CONFIG)).toEqual({
      basePath: '/gateway',
      mode: 'bff',
    });
  });

  it.each([
    'https://internal.example.test/api',
    'http://localhost:5000/api',
    '//internal.example.test/api',
    'api',
    '/',
    '/api?tenant=secret',
    '/api#fragment',
  ])('rejects non same-origin API base path %s', (basePath) => {
    expect(() => normalizeSameOriginBasePath(basePath)).toThrow(
      'API basePath must be a same-origin application path',
    );
  });

  it('accepts a configurable same-origin BFF prefix', () => {
    expect(normalizeSameOriginBasePath(' /bff/api/ ')).toBe('/bff/api');
  });
});
