import type { Type } from "../types.ts";
import { defineMetadata, getMetadata } from "../metadata/index.ts";
import { METADATA_KEYS } from "../types.ts";

export function UseInterceptors(
  ...interceptors: Type<any>[]
): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey) {
      const existing =
        getMetadata(
          METADATA_KEYS.INTERCEPTORS,
          target.constructor,
          propertyKey
        ) || [];
      defineMetadata(
        METADATA_KEYS.INTERCEPTORS,
        [...existing, ...interceptors],
        target.constructor,
        propertyKey
      );
    } else {
      defineMetadata(METADATA_KEYS.INTERCEPTORS, interceptors, target);
    }
    return (descriptor as any) || target;
  };
}
