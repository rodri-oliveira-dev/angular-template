import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import { ExampleItem } from '../models/example-item';
import { CreateExampleItemDto, ExampleItemDto } from './example-api.dto';

@Injectable({ providedIn: 'root' })
export class ExampleApiClient {
  private readonly httpClient = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly collectionUrl = `${normalizeBasePath(this.apiConfig.basePath)}/examples`;

  list(): Observable<readonly ExampleItem[]> {
    return this.httpClient
      .get<readonly ExampleItemDto[]>(this.collectionUrl)
      .pipe(map((items) => items.map(mapExampleItem)));
  }

  create(label: string): Observable<ExampleItem> {
    const request: CreateExampleItemDto = {
      name: label,
    };

    return this.httpClient
      .post<ExampleItemDto>(this.collectionUrl, request)
      .pipe(map(mapExampleItem));
  }
}

function mapExampleItem(dto: ExampleItemDto): ExampleItem {
  return {
    id: dto.id,
    label: dto.name,
  };
}

function normalizeBasePath(basePath: string): string {
  return basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
}
