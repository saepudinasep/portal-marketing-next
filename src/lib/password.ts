import { randomInt } from 'node:crypto';

import { hash } from 'bcryptjs';

export const hashPassword = (plain: string) => hash(plain, 10);

// Tanpa karakter yang mudah tertukar (0/O, 1/l/I) agar mudah disampaikan secara lisan.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGIT = '23456789';
const SYMBOL = '!@#$%&*?';

const pick = (chars: string) => chars[randomInt(chars.length)];

/** Password sementara acak (memenuhi kebijakan: huruf besar, kecil, angka, simbol). */
export function generateTempPassword(length = 12): string {
  const all = UPPER + LOWER + DIGIT + SYMBOL;
  const chars = [pick(UPPER), pick(LOWER), pick(DIGIT), pick(SYMBOL)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1); // acak Fisher-Yates
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
