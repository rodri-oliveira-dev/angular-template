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

  const record = value as Record<string, unknown>;
  const hasStandardMember = ['type', 'title', 'status', 'detail', 'instance'].some(
    (key) => Object.prototype.hasOwnProperty.call(record, key),
  );

  if (!hasStandardMember) {
    return false;
  }

  return (
    isOptionalString(record['type']) &&
    isOptionalString(record['title']) &&
    isOptionalStatus(record['status']) &&
    isOptionalString(record['detail']) &&
    isOptionalString(record['instance'])
  );
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isOptionalStatus(value: unknown): boolean {
  return value === undefined || (typeof value === 'number' && Number.isInteger(value));
}
