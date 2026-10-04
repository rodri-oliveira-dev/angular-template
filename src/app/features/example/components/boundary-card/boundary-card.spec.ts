import { TestBed } from '@angular/core/testing';

import { ArchitectureBoundary } from '../../models/architecture-boundary';
import { BoundaryCard } from './boundary-card';

describe('BoundaryCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoundaryCard],
    }).compileComponents();
  });

  it('renders the provided boundary', () => {
    const boundary: ArchitectureBoundary = {
      name: 'Feature',
      purpose: 'Own a cohesive business capability.',
      examples: ['pages', 'components', 'data-access'],
    };

    const fixture = TestBed.createComponent(BoundaryCard);
    fixture.componentRef.setInput('boundary', boundary);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h2')?.textContent).toContain('Feature');
    expect(element.textContent).toContain('Own a cohesive business capability.');
    expect(element.querySelectorAll('li')).toHaveLength(3);
  });
});
