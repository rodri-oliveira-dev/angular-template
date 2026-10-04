import { Injectable } from '@angular/core';

import { CreateExampleItemDto, ExampleItemDto } from './example-api.dto';

@Injectable({ providedIn: 'root' })
export class ExampleApiMockStore {
  private sequence = 3;

  private items: ExampleItemDto[] = [
    {
      id: 'example-1',
      name: 'Read through feature data-access',
    },
    {
      id: 'example-2',
      name: 'Map transport DTOs before rendering',
    },
  ];

  list(): readonly ExampleItemDto[] {
    return this.items.map((item) => ({ ...item }));
  }

  create(request: CreateExampleItemDto): ExampleItemDto {
    const item: ExampleItemDto = {
      id: `example-${this.sequence++}`,
      name: request.name.trim(),
    };

    this.items = [...this.items, item];

    return { ...item };
  }
}
