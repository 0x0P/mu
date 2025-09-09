import "reflect-metadata";

export class MetadataStore {
  private static store = new Map<any, Map<string | symbol, any>>();

  static set(key: string | symbol, value: any, target: any): void {
    if (!this.store.has(target)) {
      this.store.set(target, new Map());
    }
    this.store.get(target)!.set(key, value);
  }

  static get<T = any>(key: string | symbol, target: any): T | undefined {
    const targetStore = this.store.get(target);
    return targetStore?.get(key);
  }

  static has(key: string | symbol, target: any): boolean {
    const targetStore = this.store.get(target);
    return targetStore?.has(key) ?? false;
  }

  static getAll(target: any): Map<string | symbol, any> | undefined {
    return this.store.get(target);
  }

  static delete(key: string | symbol, target: any): boolean {
    const targetStore = this.store.get(target);
    return targetStore?.delete(key) ?? false;
  }

  static clear(target?: any): void {
    if (target) {
      this.store.delete(target);
    } else {
      this.store.clear();
    }
  }
}

export function getMetadata(
  key: string | symbol,
  target: any,
  propertyKey?: string | symbol
): any {
  const reflectGet = (Reflect as any)?.getMetadata;
  if (typeof reflectGet === "function") {
    return propertyKey !== undefined
      ? reflectGet(key, target, propertyKey)
      : reflectGet(key, target);
  }
  const finalTarget = propertyKey !== undefined ? target.constructor : target;
  return MetadataStore.get(key, finalTarget);
}

export function defineMetadata(
  key: string | symbol,
  value: any,
  target: any,
  propertyKey?: string | symbol
): void {
  const reflectDefine = (Reflect as any)?.defineMetadata;
  if (typeof reflectDefine === "function") {
    propertyKey !== undefined
      ? reflectDefine(key, value, target, propertyKey)
      : reflectDefine(key, value, target);
    return;
  }
  const finalTarget = propertyKey !== undefined ? target.constructor : target;
  MetadataStore.set(key, value, finalTarget);
}

export function hasMetadata(
  key: string | symbol,
  target: any,
  propertyKey?: string | symbol
): boolean {
  const reflectHas = (Reflect as any)?.hasMetadata;
  if (typeof reflectHas === "function") {
    return propertyKey !== undefined
      ? reflectHas(key, target, propertyKey)
      : reflectHas(key, target);
  }
  const finalTarget = propertyKey !== undefined ? target.constructor : target;
  return MetadataStore.has(key, finalTarget);
}

export function getOwnMetadata(
  key: string | symbol,
  target: any,
  propertyKey?: string | symbol
): any {
  const reflectGetOwn = (Reflect as any)?.getOwnMetadata;
  if (typeof reflectGetOwn === "function") {
    return propertyKey !== undefined
      ? reflectGetOwn(key, target, propertyKey)
      : reflectGetOwn(key, target);
  }
  const finalTarget = propertyKey !== undefined ? target.constructor : target;
  return MetadataStore.get(key, finalTarget);
}

export function getParamTypes(
  target: any,
  propertyKey?: string | symbol
): any[] {
  const reflectGet = (Reflect as any)?.getMetadata;
  if (typeof reflectGet === "function") {
    return propertyKey !== undefined
      ? reflectGet("design:paramtypes", target, propertyKey) || []
      : reflectGet("design:paramtypes", target) || [];
  }
  const key = propertyKey
    ? `params:${String(propertyKey)}`
    : "params:constructor";
  return MetadataStore.get(key, target) ?? [];
}

export function setParamTypes(
  target: any,
  types: any[],
  propertyKey?: string | symbol
): void {
  const reflectDefine = (Reflect as any)?.defineMetadata;
  if (typeof reflectDefine === "function") {
    propertyKey !== undefined
      ? reflectDefine("design:paramtypes", types, target, propertyKey)
      : reflectDefine("design:paramtypes", types, target);
    return;
  }
  const key = propertyKey
    ? `params:${String(propertyKey)}`
    : "params:constructor";
  MetadataStore.set(key, types, target);
}
