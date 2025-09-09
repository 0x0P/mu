import type { Type, ModuleMetadata, muApplicationOptions } from "../types.ts";
import { Logger } from "../logger/logger.ts";
import { DIContainer } from "../di/container.ts";
import { muWebSocketServer } from "../server/server.ts";
import { getMetadata } from "../metadata/index.ts";

export class muApplication {
  private container: DIContainer;
  private server: muWebSocketServer;
  private rootModule: Type<any>;
  private options: muApplicationOptions;

  constructor(rootModule: Type<any>, options: muApplicationOptions = {}) {
    this.rootModule = rootModule;
    this.options = options || {};
    this.container = new DIContainer();
    this.server = new muWebSocketServer(this.container, this.options);
  }

  async start(): Promise<void> {
    Logger.configure({
      logger: this.options?.logger,
      levels: this.options?.logLevels,
      options: this.options?.loggerOptions,
      debug: this.options?.debug,
    });

    Logger.log("Initializing mu Application...", "muApplication");
    await this.initializeModule(this.rootModule);
    await this.server.start();
    Logger.log("mu Application is ready!", "muApplication");
  }

  async stop(): Promise<void> {
    await this.server.stop();
    this.container.clear();
    Logger.log("mu Application stopped", "muApplication");
  }

  private async initializeModule(moduleClass: Type<any>): Promise<void> {
    const metadata: ModuleMetadata = getMetadata("mu:module", moduleClass);
    if (!metadata) {
      throw new Error(
        `${moduleClass.name} is not a valid module. Did you forget @Module decorator?`
      );
    }
    if (metadata.imports) {
      for (const importedModule of metadata.imports) {
        await this.initializeModule(importedModule);
      }
    }
    if (metadata.providers) {
      this.container.registerMany(metadata.providers);
    }
    if (metadata.controllers) {
      for (const controller of metadata.controllers) {
        this.container.register(controller);
      }
    }
  }

  getServer(): muWebSocketServer {
    return this.server;
  }
  getContainer(): DIContainer {
    return this.container;
  }
  static create(
    module: Type<any>,
    options?: muApplicationOptions
  ): muApplication {
    return new muApplication(module, options);
  }
  static async bootstrap(
    module: Type<any>,
    options?: muApplicationOptions
  ): Promise<muApplication> {
    const app = new muApplication(module, options);
    await app.start();
    return app;
  }
}
