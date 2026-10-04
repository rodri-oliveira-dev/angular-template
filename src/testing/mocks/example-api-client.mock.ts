import { of } from 'rxjs';
import { vi } from 'vitest';

import { ExampleItem } from '../../app/features/example/models/example-item';
import { createExampleItem } from '../fixtures/example-item.fixture';

interface ExampleApiClientMockOptions {
  readonly listResult?: readonly ExampleItem[];
  readonly createResult?: ExampleItem;
}

export function createExampleApiClientMock(options: ExampleApiClientMockOptions = {}) {
  const listResult = options.listResult ?? [createExampleItem()];
  const createResult =
    options.createResult ??
    createExampleItem({
      id: 'example-created',
      label: 'Created example',
    });

  return {
    list: vi.fn(() => of(listResult)),
    create: vi.fn(() => of(createResult)),
  };
}
