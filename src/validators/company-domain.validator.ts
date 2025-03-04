import { ValidationOptions, registerDecorator } from 'class-validator';

const commonDomains = new Set([
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'aol.com',
  'zoho.com',
  'protonmail.com',
]);

export function IsCompanyDomain(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) =>
    registerDecorator({
      name: 'IsCompanyDomain',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(email: string): boolean {
          const domain = email.split('@')[1];
          return Boolean(domain && !commonDomains.has(domain.toLowerCase()));
        },
      },
    });
}
