import { METADATA_KEYS } from "../types.ts";
import type { ModuleMetadata } from "../types.ts";
import { defineMetadata } from "../metadata/index.ts";

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: any) => {
    defineMetadata(METADATA_KEYS.MODULE, metadata, target);
  };
}
