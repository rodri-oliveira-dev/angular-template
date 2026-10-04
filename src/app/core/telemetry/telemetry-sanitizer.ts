import { TelemetryAttributes, TelemetryAttributeValue } from './telemetry.types';

const sensitiveKeyPattern =
  /(?:authorization|cookie|token|password|secret|payload|request.?body|response.?body|email|phone|cpf|cnpj|ssn|document)/i;

const bearerPattern = /^bearer\s+/i;
const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const maxStringLength = 256;

export function sanitizeTelemetryAttributes(
  attributes: TelemetryAttributes = {},
): TelemetryAttributes {
  const sanitized: Record<string, TelemetryAttributeValue> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (sensitiveKeyPattern.test(key)) {
      continue;
    }

    sanitized[key] = sanitizeValue(value);
  }

  return sanitized;
}

function sanitizeValue(value: TelemetryAttributeValue): TelemetryAttributeValue {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.slice(0, maxStringLength);

  if (
    bearerPattern.test(trimmed) ||
    jwtPattern.test(trimmed) ||
    emailPattern.test(trimmed)
  ) {
    return '[redacted]';
  }

  return trimmed;
}
