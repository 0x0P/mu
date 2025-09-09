import { METADATA_KEYS } from "../types.ts";
import { defineMetadata } from "../metadata/index.ts";

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
