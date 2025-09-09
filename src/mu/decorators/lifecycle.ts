import { defineMetadata } from "../metadata/index.ts";

export function OnConnect(): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    defineMetadata("mu:on-connect", propertyKey, target.constructor);
    return descriptor;
  };
}

export function OnDisconnect(): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    defineMetadata("mu:on-disconnect", propertyKey, target.constructor);
    return descriptor;
  };
}

export function OnError(): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    defineMetadata("mu:on-error", propertyKey, target.constructor);
    return descriptor;
  };
}
