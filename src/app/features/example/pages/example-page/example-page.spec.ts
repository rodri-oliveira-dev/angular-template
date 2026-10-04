import { TestBed } from '@angular/core/testing';

import { createExampleItem } from '../../../../../testing/fixtures/example-item.fixture';
import { createExampleApiClientMock } from '../../../../../testing/mocks/example-api-client.mock';
import { ExampleApiClient } from '../../data-access/example-api-client';
import { ExamplePage } from './example-page';

describe('ExamplePage', () => {
  let apiClient: ReturnType<typeof createExampleApiClientMock>;

  beforeEach(async () => {
    apiClient = createExampleApiClientMock({
      listResult: [createExampleItem({ label: 'Loaded through data-access' })],
      createResult: createExampleItem({
        id: 'example-2',
        label: 'Created through data-access',
      }),
    });

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

  it('adds an item through the feature data-access dependency', async () => {
    const fixture = TestBed.createComponent(ExamplePage);
    await fixture.whenStable();

    const addButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Add example'),
    );

    addButton?.click();
    fixture.detectChanges();

    expect(apiClient.create).toHaveBeenCalledWith('Example 2');
    expect(fixture.nativeElement.querySelector('.api-items')?.textContent).toContain(
      'Created through data-access',
    );
  });
});
