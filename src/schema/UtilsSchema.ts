import { Type } from "@sinclair/typebox";

export const nonEmptyString = Type.String({ minLength: 1 });