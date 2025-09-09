import { defineMetadata, getMetadata } from "../metadata/index.ts";

export function Payload(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existing =
      getMetadata("mu:params", target.constructor, propertyKey) || [];
    existing[parameterIndex] = { type: "payload" };
    defineMetadata("mu:params", existing, target.constructor, propertyKey);
  };
}

export function Message(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existing =
      getMetadata("mu:params", target.constructor, propertyKey) || [];
    existing[parameterIndex] = { type: "message" };
    defineMetadata("mu:params", existing, target.constructor, propertyKey);
  };
}

export function Socket(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existing =
      getMetadata("mu:params", target.constructor, propertyKey) || [];
    existing[parameterIndex] = { type: "socket" };
    defineMetadata("mu:params", existing, target.constructor, propertyKey);
  };
}

export function Context(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existing =
      getMetadata("mu:params", target.constructor, propertyKey) || [];
    existing[parameterIndex] = { type: "context" };
    defineMetadata("mu:params", existing, target.constructor, propertyKey);
  };
}

export function Headers(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existing =
      getMetadata("mu:params", target.constructor, propertyKey) || [];
    existing[parameterIndex] = { type: "headers" };
    defineMetadata("mu:params", existing, target.constructor, propertyKey);
  };
}

export function Query(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existing =
      getMetadata("mu:params", target.constructor, propertyKey) || [];
    existing[parameterIndex] = { type: "query" };
    defineMetadata("mu:params", existing, target.constructor, propertyKey);
  };
}

export function Ip(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existing =
      getMetadata("mu:params", target.constructor, propertyKey) || [];
    existing[parameterIndex] = { type: "ip" };
    defineMetadata("mu:params", existing, target.constructor, propertyKey);
  };
}

export function Handshake(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) return;
    const existing =
      getMetadata("mu:params", target.constructor, propertyKey) || [];
    existing[parameterIndex] = { type: "handshake" };
    defineMetadata("mu:params", existing, target.constructor, propertyKey);
  };
}
