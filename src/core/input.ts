export const MAX_INT_DIGITS = 12;
export const MAX_DEC_DIGITS = 6;

export type AmountValidation =
  | { ok: true }
  | { ok: false; reason: 'empty'; message: string }
  | { ok: false; reason: 'incomplete' } // ex.: "345."
  | { ok: false; reason: 'invalid'; message: string };

export function normalizeAmountInput(raw: string): string {
  let s = raw.trim();

  // vírgula -> ponto
  s = s.replace(/,/g, '.');

  // remove tudo que não é dígito ou ponto
  s = s.replace(/[^\d.]/g, '');

  // mantém apenas o primeiro ponto
  const firstDot = s.indexOf('.');
  let hasDot = false;
  if (firstDot !== -1) {
    hasDot = true;
    const before = s.slice(0, firstDot);
    const after = s.slice(firstDot + 1).replace(/\./g, '');
    s = before + '.' + after; // agora, no máximo, 1 ponto
  }

  // se começar com ponto, prefixa 0
  if (s.startsWith('.')) s = '0' + s;

  // separa partes
  const [intPartRaw, decPartRaw = ''] = s.split('.');
  // remove zeros à esquerda (mantém único 0)
  const intNoLeading = intPartRaw.replace(/^0+(?=\d)/, '');

  // aplica limites
  const intLimited = intNoLeading.slice(0, MAX_INT_DIGITS);
  const decLimited = decPartRaw.slice(0, MAX_DEC_DIGITS);

  // remonta, preservando ponto terminal se o usuário acabou de digitá-lo
  if (decLimited.length > 0) {
    return `${intLimited || '0'}.${decLimited}`;
  }
  if (hasDot) {
    // usuário digitou '.', mas ainda sem decimais → manter ponto terminal
    return `${intLimited || '0'}.`;
  }
  return intLimited || (intPartRaw ? '0' : '');
}

export function validateAmount(value: string): AmountValidation {
  if (!value) return { ok: false, reason: 'empty', message: 'Informe um valor.' };

  // Permite estado intermediário: "123."
  if (/^\d+\.$/.test(value)) return { ok: false, reason: 'incomplete' };

  // Formato final válido: "123" ou "123.45"
  if (!/^\d+(\.\d+)?$/.test(value)) {
    return { ok: false, reason: 'invalid', message: 'Valor inválido.' };
  }

  return { ok: true };
}

/** tamanho máximo útil para o maxLength do input */
export const MAX_INPUT_LENGTH =
  MAX_INT_DIGITS + (MAX_DEC_DIGITS > 0 ? 1 + MAX_DEC_DIGITS : 0);
