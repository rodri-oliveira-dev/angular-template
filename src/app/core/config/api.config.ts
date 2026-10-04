import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

export interface ApiConfig {
  readonly basePath: string;
  readonly useLocalMock: boolean;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');

export function provideApiConfig(config: ApiConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: API_CONFIG,
      useValue: config,
    },
  ]);
}
