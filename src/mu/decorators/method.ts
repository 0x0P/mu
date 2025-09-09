import { METADATA_KEYS } from "../types.ts";
import type { MethodMetadata } from "../types.ts";
import { defineMetadata, getMetadata } from "../metadata/index.ts";

export function Method(eventType: string): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const methods =
      getMetadata(METADATA_KEYS.METHOD, target.constructor) ||
      new Map<string, MethodMetadata>();
    methods.set(eventType, { propertyKey, handler: eventType });
    defineMetadata(METADATA_KEYS.METHOD, methods, target.constructor);
    defineMetadata(
      `mu:method:${String(propertyKey)}`,
      eventType,
      target.constructor
    );
    return descriptor;
  };
}
