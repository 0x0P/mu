import { METADATA_KEYS } from "../types.ts";
import { defineMetadata } from "../metadata/index.ts";

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
