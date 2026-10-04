import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { provideApiConfig } from '../../../core/config/api.config';
import { correlationIdInterceptor } from '../../../core/http/correlation-id.interceptor';
import { httpErrorInterceptor } from '../../../core/http/http-error.interceptor';
import { ExampleApiClient } from './example-api-client';
import { exampleApiMockInterceptor } from './example-api-mock.interceptor';

describe('exampleApiMockInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideApiConfig({
          basePath: '/api',
          useLocalMock: true,
        }),
        provideHttpClient(
          withInterceptors([
            correlationIdInterceptor,
            httpErrorInterceptor,
            exampleApiMockInterceptor,
          ]),
        ),
      ],
    });
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
});
