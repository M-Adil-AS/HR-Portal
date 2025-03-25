import { Transform } from 'class-transformer';
import validator from 'validator';

export function NormalizeEmail() {
  return Transform(({ value }) =>
    typeof value === 'string' ? validator.normalizeEmail(value) : value,
  );
}
