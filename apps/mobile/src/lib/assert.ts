export function assertDefined<T>(
  value: T | undefined | null,
  message?: string,
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message ?? 'Value is undefined');
  }
}
