import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ExampleApiClient } from '../../data-access/example-api-client';
import { ExamplePage } from './example-page';

describe('ExamplePage', () => {
  const apiClient = {
    list: vi.fn(() =>
      of([
        {
          id: 'example-1',
          label: 'Loaded through data-access',
        },
      ]),
    ),
    create: vi.fn(() =>
      of({
        id: 'example-2',
        label: 'Created through data-access',
      }),
    ),
  };

  beforeEach(async () => {
    apiClient.list.mockClear();
    apiClient.create.mockClear();

    await TestBed.configureTestingModule({
      imports: [ExamplePage],
      providers: [
        {
          provide: ExampleApiClient,
          useValue: apiClient,
        },
      ],
    }).compileComponents();
  });

  it('renders architecture boundaries and data loaded through data-access', async () => {
    const fixture = TestBed.createComponent(ExamplePage);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const cards = element.querySelectorAll('app-boundary-card');

    expect(cards).toHaveLength(3);
    expect(element.querySelector('h1')?.textContent).toContain('Feature-first by default');
    expect(element.querySelector('.api-items')?.textContent).toContain(
      'Loaded through data-access',
    );
    expect(apiClient.list).toHaveBeenCalledOnce();
  });
});
