export interface ProblemDetails {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly [key: string]: unknown;
}

export function isProblemDetails(value: unknown): value is ProblemDetails {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'type' in value ||
    'title' in value ||
    'status' in value ||
    'detail' in value ||
    'instance' in value
  );
}
