import { TestBed } from '@angular/core/testing';

import { ExamplePage } from './example-page';

describe('ExamplePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamplePage],
    }).compileComponents();
  });

  it('renders the architecture boundaries', async () => {
    const fixture = TestBed.createComponent(ExamplePage);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const cards = element.querySelectorAll('app-boundary-card');

    expect(cards).toHaveLength(3);
    expect(element.querySelector('h1')?.textContent).toContain('Feature-first by default');
  });
});
