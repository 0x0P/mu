import type { Type } from "../types.ts";
import { defineMetadata, getMetadata } from "../metadata/index.ts";

export function Inject(token: string | symbol | Type<any>): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    const existingTokens = getMetadata("mu:inject:constructor", target) || {};
    existingTokens[parameterIndex] = token;
    defineMetadata("mu:inject:constructor", existingTokens, target);
  };
}
