import "reflect-metadata";
export { muApplication } from "./mu/app/application.ts";
export { muWebSocketServer } from "./mu/server/server.ts";
export { DIContainer, globalContainer } from "./mu/di/container.ts";
export { Logger } from "./mu/logger/logger.ts";

export * from "./mu/decorators/index.ts";

export type {
  Constructor,
  Type,
  WebSocketMessage,
  WebSocketResponse,
  WebSocketContext,
  Guard,
  Interceptor,
  MethodMetadata,
  ControllerMetadata,
  ModuleMetadata,
  Provider,
  ProviderScope,
  muApplicationOptions,
  CorsOptions,
  OnConnection,
  OnDisconnect as OnDisconnection,
  OnError as OnErrorHandler,
  HandshakeInfo,
  Serializer,
  ResponseAdapter,
  LogLevel,
  LoggerService,
  LoggerOptions,
} from "./mu/types.ts";

export {
  MetadataStore,
  getMetadata,
  defineMetadata,
  hasMetadata,
  getOwnMetadata,
  getParamTypes,
  setParamTypes,
} from "./mu/metadata/index.ts";

export const VERSION = "1.0.1";

import type { muApplicationOptions as _muApplicationOptions } from "./mu/types.ts";
import { muApplication as _muApplication } from "./mu/app/application.ts";

export async function createmuApp(
  module: any,
  options?: _muApplicationOptions
): Promise<_muApplication> {
  return _muApplication.bootstrap(module, options);
}
