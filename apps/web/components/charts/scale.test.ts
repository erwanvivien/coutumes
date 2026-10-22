import { describe, expect, it } from 'vitest';
import { niceTicks } from './scale';

describe('niceTicks', () => {
  it('keeps the top close to the data', () => {
    expect(niceTicks(60004)).toEqual([0, 25000, 50000, 75000]);
    expect(niceTicks(3987)).toEqual([0, 1000, 2000, 3000, 4000]);
    expect(niceTicks(60000)).toEqual([0, 20000, 40000, 60000]);
  });

  it('handles an empty month', () => {
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});
