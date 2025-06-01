import { Value, ValueError } from '@sinclair/typebox/value';
import { TSchema } from '@sinclair/typebox';

export type SchemaValidationError = Pick<ValueError, 'path' | 'value' | 'message'>;

export const getValidatorErrors = <T extends TSchema>(data: unknown, schema: T): SchemaValidationError[] => {
  const valueErrors = Value.Errors(schema, data);
  const errors: SchemaValidationError[] = [];

  if (valueErrors) {
    for (const error of valueErrors) {
      if (error && typeof error === 'object' && 'path' in error && 'message' in error) {
        const typeSafeError: SchemaValidationError = {
          path: String(error.path),
          value: 'value' in error ? error.value : undefined,
          message: String(error.message),
        };
        errors.push(typeSafeError);
      }
    }
  }

  return errors;
};
