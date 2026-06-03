const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
assertDefined(NEXT_PUBLIC_BASE_URL, 'NEXT_PUBLIC_BASE_URL is not defined');

/** Concatenates classes if they are truthy */
export const cx = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(' ');

export const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export function assert<T>(value: T, message?: string): asserts value {
  if (!value) {
    throw new Error(message ?? 'Value does not respect assert');
  }
}

export function assertDefined<T>(
  value: T | undefined | null,
  message?: string,
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message ?? 'Value is undefined');
  }
}

export function assertNever(value: never, message?: string): never {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(message ?? `Unexpected value: ${value}`);
}

export type AbsoluteUrl = string & { toPathname: () => `/${string}` };

export const absoluteUrl = (pathname: `/${string}`): AbsoluteUrl => {
  const abs = `${NEXT_PUBLIC_BASE_URL}${pathname}`;
  return Object.assign(abs, { toPathname: () => pathname });
};
