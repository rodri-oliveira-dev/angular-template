export interface NgNewSchema {
  name: string;
  apiMode?: 'mock' | 'bff';
  bffProxyTarget?: string;
  coverageThreshold?: number;
  directory?: string;
  e2e?: boolean;
  observability?: boolean;
  routing?: boolean;
  skipGit?: boolean;
  skipInstall?: boolean;
  style?: 'css' | 'scss';
}
