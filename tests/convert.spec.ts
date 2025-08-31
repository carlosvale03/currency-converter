import { describe, it, expect } from 'vitest';
import { convert } from '@/core/convert';

describe('convert', () => {
  it('converts using decimal strings', () => {
    const out = convert('100', { from: 'USD', to: 'BRL', value: '5.1234' });
    expect(out).toBe('512.34'); // arredondamento bancário p/ 2 casas
  });

  it('throws on negative', () => {
    expect(() => convert('-1', { from: 'USD', to: 'BRL', value: '5' })).toThrow();
  });
});
