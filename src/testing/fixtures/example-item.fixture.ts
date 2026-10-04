import { ExampleItem } from '../../app/features/example/models/example-item';

export function createExampleItem(overrides: Partial<ExampleItem> = {}): ExampleItem {
  return {
    id: 'example-1',
    label: 'Example item',
    ...overrides,
  };
}
