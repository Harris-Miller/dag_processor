import { describe, expect, it } from 'bun:test';

import { topSort } from '../dag';

describe('dag', () => {
  it('sorts', () => {
    const dag1 = {
      a: [],
      b: [],
      c: ['a', 'b'],
      d: ['a', 'e'],
      e: ['c'],
      f: ['d', 'e'],
    };

    expect(topSort(dag1)).toEqual(['a', 'b', 'c', 'e', 'd', 'f']);
  });
});
