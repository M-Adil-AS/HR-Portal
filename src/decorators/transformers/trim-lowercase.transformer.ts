import { Transform } from 'class-transformer';

export function TrimAndLowerCase() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
}
