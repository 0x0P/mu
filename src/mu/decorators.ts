import "reflect-metadata";
import { METADATA_KEYS } from "./types.ts";
import type { Type, ModuleMetadata, MethodMetadata } from "./types.ts";
import { defineMetadata, getMetadata } from "./metadata/index.ts";

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: any) => {
    defineMetadata(METADATA_KEYS.MODULE, metadata, target);
  };
}

export function Injectable(): ClassDecorator {
  return (target: any) => {
    defineMetadata(METADATA_KEYS.INJECTABLE, true, target);

    const paramTypes =
      (Reflect as any)?.getMetadata?.("design:paramtypes", target) || [];
    if (paramTypes.length > 0) {
      defineMetadata("mu:paramtypes", paramTypes, target);
    }
  };
}

export function Controller(prefix?: string): ClassDecorator {
  return (target: any) => {
    defineMetadata(METADATA_KEYS.CONTROLLER, true, target);
    if (prefix) {
      defineMetadata("mu:controller:prefix", prefix, target);
    }
    const paramTypes =
      (Reflect as any)?.getMetadata?.("design:paramtypes", target) || [];
    if (paramTypes.length > 0) {
      defineMetadata("mu:paramtypes", paramTypes, target);
    }
  };
}

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

export function UseGuards(
  ...guards: Type<any>[]
): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey) {
      const existingGuards =
        getMetadata(METADATA_KEYS.GUARDS, target.constructor, propertyKey) ||
        [];
      defineMetadata(
        METADATA_KEYS.GUARDS,
        [...existingGuards, ...guards],
        target.constructor,
        propertyKey
      );
    } else {
      defineMetadata(METADATA_KEYS.GUARDS, guards, target);
    }
    return descriptor || target;
  };
}

export function UseInterceptors(
  ...interceptors: Type<any>[]
): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey) {
      const existingInterceptors =
        getMetadata(
          METADATA_KEYS.INTERCEPTORS,
          target.constructor,
          propertyKey
        ) || [];
      defineMetadata(
        METADATA_KEYS.INTERCEPTORS,
        [...existingInterceptors, ...interceptors],
        target.constructor,
        propertyKey
      );
    } else {
      defineMetadata(METADATA_KEYS.INTERCEPTORS, interceptors, target);
    }
    return descriptor || target;
  };
}

export function Payload(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existingParams =
      getMetadata("mu:params", target.constructor, propertyKey) || [];
    existingParams[parameterIndex] = { type: "payload" };
    defineMetadata(
      "mu:params",
      existingParams,
      target.constructor,
      propertyKey
    );
  };
}

export function Message(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existingParams =
      getMetadata("mu:params", target.constructor, propertyKey) || [];
    existingParams[parameterIndex] = { type: "message" };
    defineMetadata(
      "mu:params",
      existingParams,
      target.constructor,
      propertyKey
    );
  };
}

export function Socket(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existingParams =
      getMetadata("mu:params", target.constructor, propertyKey) || [];
    existingParams[parameterIndex] = { type: "socket" };
    defineMetadata(
      "mu:params",
      existingParams,
      target.constructor,
      propertyKey
    );
  };
}

export function Context(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existingParams =
      getMetadata("mu:params", target.constructor, propertyKey) || [];
    existingParams[parameterIndex] = { type: "context" };
    defineMetadata(
      "mu:params",
      existingParams,
      target.constructor,
      propertyKey
    );
  };
}
