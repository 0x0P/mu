import type { Type } from "../types.ts";
import { defineMetadata, getMetadata } from "../metadata/index.ts";
import { METADATA_KEYS } from "../types.ts";

export function UseGuards(
  ...guards: Type<any>[]
): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey) {
      const existing =
        getMetadata(METADATA_KEYS.GUARDS, target.constructor, propertyKey) ||
        [];
      defineMetadata(
        METADATA_KEYS.GUARDS,
        [...existing, ...guards],
        target.constructor,
        propertyKey
      );
    } else {
      defineMetadata(METADATA_KEYS.GUARDS, guards, target);
    }
    return (descriptor as any) || target;
  };
}
