import { describe, it, expect } from 'vitest';
import { convert } from '@/core/convert';

describe('convert()', () => {
  it('converte 100 para BRL com taxa numérica', () => {
    const out = convert('100', { value: 5.1234 }); // apenas value:number
    expect(Number(out)).toBeGreaterThan(0);
  });

  it('lança erro para valor negativo', () => {
    expect(() => convert('-1', { value: 5 })).toThrow();
  });
});