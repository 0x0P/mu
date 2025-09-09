import type { Type, Provider, Constructor, ProviderScope } from "../types.ts";
import { METADATA_KEYS } from "../types.ts";
import { getMetadata } from "../metadata/index.ts";

export class DIContainer {
  private instances = new Map<any, any>();
  private connectionScopedInstances = new Map<string, Map<any, any>>();
  private providers = new Map<any, Provider>();
  private resolving = new Set<any>();
  private asyncResolving = new Set<any>();
  private pendingAsync = new Map<any, Promise<any>>();
  private pendingAsyncByConnection = new Map<string, Map<any, Promise<any>>>();

  register<T>(provider: Provider<T>): void {
    if (this.isClassProvider(provider)) {
      this.providers.set(provider, provider);
    } else {
      const complexProvider = provider as any;
      const token = complexProvider.provide;
      this.providers.set(token, provider);
    }
  }

  registerMany(providers: Provider[]): void {
    providers.forEach((provider) => this.register(provider));
  }

  resolve<T>(token: Type<T> | string | symbol, connectionId?: string): T {
    if (!connectionId && this.instances.has(token)) {
      return this.instances.get(token);
    }
    if (connectionId) {
      const bucket = this.connectionScopedInstances.get(connectionId);
      if (bucket && bucket.has(token)) {
        return bucket.get(token);
      }
    }
    if (this.resolving.has(token)) {
      throw new Error(
        `Circular dependency detected for ${this.getTokenName(token)}`
      );
    }
    this.resolving.add(token);
    try {
      const provider = this.providers.get(token);
      if (!provider) {
        if (typeof token === "function") {
          const instance = this.createInstance(token as Constructor) as T;
          this.setResolvedInstance(token, instance, connectionId);
          return instance;
        }
        throw new Error(`No provider found for ${this.getTokenName(token)}`);
      }
      const instance = this.createFromProvider(provider, connectionId) as T;
      this.setResolvedInstance(token, instance, connectionId, provider);
      return instance;
    } finally {
      this.resolving.delete(token);
    }
  }

  async resolveAsync<T>(
    token: Type<T> | string | symbol,
    connectionId?: string
  ): Promise<T> {
    if (!connectionId && this.instances.has(token)) {
      return this.instances.get(token);
    }
    if (connectionId) {
      const bucket = this.connectionScopedInstances.get(connectionId);
      if (bucket && bucket.has(token)) {
        return bucket.get(token);
      }
    }

    const pendingBucket = this.getPendingBucket(connectionId);
    const existingPending = pendingBucket.get(token);
    if (existingPending) return existingPending as Promise<T>;

    if (this.asyncResolving.has(token)) {
      throw new Error(
        `Circular dependency detected for ${this.getTokenName(token)} (async)`
      );
    }
    this.asyncResolving.add(token);

    const promise = (async () => {
      try {
        const provider = this.providers.get(token);
        if (!provider) {
          if (typeof token === "function") {
            const instance = await this.createInstanceAsync(
              token as Constructor
            );
            this.setResolvedInstance(token, instance, connectionId);
            return instance as T;
          }
          throw new Error(`No provider found for ${this.getTokenName(token)}`);
        }
        const instance = await this.createFromProviderAsync(
          provider,
          connectionId
        );
        this.setResolvedInstance(token, instance, connectionId, provider);
        return instance as T;
      } finally {
        this.asyncResolving.delete(token);
        pendingBucket.delete(token);
      }
    })();

    pendingBucket.set(token, promise);
    return promise;
  }

  has(token: any): boolean {
    return this.providers.has(token) || this.instances.has(token);
  }

  setInstance<T>(token: any, instance: T): void {
    this.instances.set(token, instance);
  }

  clear(): void {
    this.instances.clear();
    this.connectionScopedInstances.clear();
    this.providers.clear();
    this.resolving.clear();
  }

  private createFromProvider<T>(
    provider: Provider<T>,
    connectionId?: string
  ): T {
    if (this.isClassProvider(provider)) {
      return this.createInstance(provider as Constructor<T>);
    }
    const complexProvider = provider as any;
    if (complexProvider.useValue !== undefined) {
      return complexProvider.useValue;
    }
    if (complexProvider.useClass) {
      return this.createInstance(complexProvider.useClass);
    }
    if (complexProvider.useFactory) {
      const deps = (complexProvider.inject || []).map((dep: any) =>
        this.resolve(dep, connectionId)
      );
      const result = complexProvider.useFactory(...deps);
      if (result && typeof (result as any).then === "function") {
        throw new Error(
          "Provider factory returned a Promise. Use resolveAsync() for async providers."
        );
      }
      return result as T;
    }
    throw new Error("Invalid provider configuration");
  }

  private createInstance<T>(constructor: Constructor<T>): T {
    const paramTypes =
      getMetadata(METADATA_KEYS.PARAM_TYPES, constructor) ||
      getMetadata("mu:paramtypes", constructor) ||
      [];
    const injectTokens =
      getMetadata("mu:inject:constructor", constructor) || {};
    const dependencies: any[] = [];
    if (paramTypes.length > 0) {
      for (let i = 0; i < paramTypes.length; i++) {
        const customToken = injectTokens[i];
        const token = customToken || paramTypes[i];
        if (!token) {
          throw new Error(
            `No injection token for parameter #${i} of ${constructor.name}`
          );
        }
        try {
          const dependencyInstance = this.resolve(token);
          dependencies.push(dependencyInstance);
        } catch (e) {
          throw new Error(
            `Failed to resolve dependency for parameter #${i} of ${
              constructor.name
            }: ${this.getTokenName(token)}`
          );
        }
      }
    }
    return new constructor(...dependencies);
  }

  private async createFromProviderAsync<T>(
    provider: Provider<T>,
    connectionId?: string
  ): Promise<T> {
    if (this.isClassProvider(provider)) {
      return await this.createInstanceAsync(provider as Constructor<T>);
    }
    const complexProvider = provider as any;
    if (complexProvider.useValue !== undefined) {
      return (await Promise.resolve(complexProvider.useValue)) as T;
    }
    if (complexProvider.useClass) {
      return await this.createInstanceAsync(complexProvider.useClass);
    }
    if (complexProvider.useFactory) {
      const deps = await Promise.all(
        (complexProvider.inject || []).map((dep: any) =>
          this.resolveAsync(dep, connectionId)
        )
      );
      const result = complexProvider.useFactory(...deps);
      return (await Promise.resolve(result)) as T;
    }
    throw new Error("Invalid provider configuration");
  }

  private async createInstanceAsync<T>(
    constructor: Constructor<T>
  ): Promise<T> {
    const paramTypes =
      getMetadata(METADATA_KEYS.PARAM_TYPES, constructor) ||
      getMetadata("mu:paramtypes", constructor) ||
      [];
    const injectTokens =
      getMetadata("mu:inject:constructor", constructor) || {};
    const dependencies: any[] = [];
    if (paramTypes.length > 0) {
      for (let i = 0; i < paramTypes.length; i++) {
        const customToken = injectTokens[i];
        const token = customToken || paramTypes[i];
        if (!token) {
          throw new Error(
            `No injection token for parameter #${i} of ${constructor.name}`
          );
        }
        try {
          const dependencyInstance = await this.resolveAsync(token);
          dependencies.push(dependencyInstance);
        } catch (e) {
          throw new Error(
            `Failed to resolve dependency for parameter #${i} of ${
              constructor.name
            }: ${this.getTokenName(token)}`
          );
        }
      }
    }
    return new constructor(...dependencies);
  }

  private getPendingBucket(connectionId?: string): Map<any, Promise<any>> {
    if (!connectionId) return this.pendingAsync;
    let bucket = this.pendingAsyncByConnection.get(connectionId);
    if (!bucket) {
      bucket = new Map();
      this.pendingAsyncByConnection.set(connectionId, bucket);
    }
    return bucket;
  }

  private isClassProvider(provider: any): provider is Constructor {
    return typeof provider === "function";
  }

  private getTokenName(token: any): string {
    if (typeof token === "string") return token;
    if (typeof token === "symbol") return token.toString();
    if (typeof token === "function") return token.name || "Anonymous";
    return String(token);
  }

  private getProviderScope(provider?: Provider): ProviderScope {
    if (!provider || this.isClassProvider(provider)) return "singleton";
    const scope = (provider as any).scope as ProviderScope | undefined;
    return scope || "singleton";
  }

  private setResolvedInstance(
    token: any,
    instance: any,
    connectionId?: string,
    provider?: Provider
  ): void {
    const scope = this.getProviderScope(provider);
    if (scope === "connection" && connectionId) {
      let bucket = this.connectionScopedInstances.get(connectionId);
      if (!bucket) {
        bucket = new Map();
        this.connectionScopedInstances.set(connectionId, bucket);
      }
      bucket.set(token, instance);
      return;
    }
    this.instances.set(token, instance);
  }

  getAllControllers(): any[] {
    const controllers: any[] = [];
    for (const [token, provider] of this.providers) {
      // 컨트롤러는 클래스 프로바이더로만 등록되므로, 비클래스 프로바이더는 건너뜁니다.
      if (!this.isClassProvider(provider)) continue;
      const isController = getMetadata("mu:controller", provider as any);
      if (isController) controllers.push(this.resolve(token));
    }
    return controllers;
  }
}

export const globalContainer = new DIContainer();
