export type Constructor<T = {}> = new (...args: any[]) => T;

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

export interface WebSocketMessage<T = any> {
  type: string;
  payload?: T;
  id?: string | number;
}

export interface WebSocketResponse<T = any> {
  type?: string;
  success?: boolean;
  data?: T;
  error?: string;
  id?: string | number;
}

export interface HandshakeInfo {
  url: string;
  headers: Record<string, string>;
  query: Record<string, string | string[]>;
  ip?: string;
}

export interface MethodMetadata {
  propertyKey: string | symbol;
  handler: string;
}

export interface ControllerMetadata {
  prefix?: string;
  methods: Map<string, MethodMetadata>;
}

export interface ModuleMetadata {
  controllers?: Type<any>[];
  providers?: Provider[];
  imports?: Type<any>[];
  exports?: Type<any>[];
}

export interface OnConnection {
  onConnection?(ws: any): void | Promise<void>;
}

export interface OnDisconnect {
  onDisconnect?(ws: any): void | Promise<void>;
}

export interface OnError {
  onError?(ws: any, error: Error): void | Promise<void>;
}

export type Provider<T = any> =
  | Type<T>
  | {
      provide: string | symbol | Type<T>;
      useClass?: Type<T>;
      useValue?: T;
      useFactory?: (...args: any[]) => T | Promise<T>;
      inject?: Array<string | symbol | Type<any>>;
      scope?: ProviderScope;
    };

export type ProviderScope = "singleton" | "connection";

export interface muApplicationOptions {
  port?: number;
  hostname?: string;
  maxPayloadLength?: number;
  backpressureLimit?: number;
  closeOnBackpressureLimit?: boolean;
  idleTimeout?: number;
  perMessageDeflate?: boolean;
  cors?: boolean | CorsOptions;
  debug?: boolean;
  /**
   * 활성화할 로그 레벨 목록. 지정하지 않으면 debug 여부에 따라 기본값 사용
   */
  logLevels?: LogLevel[];
  /**
   * 커스텀 로거 서비스 주입 (Nest Logger 호환 인터페이스)
   */
  logger?: LoggerService;
  /**
   * 기본 로거 포맷 및 동작 옵션
   */
  loggerOptions?: LoggerOptions;
  serializer?: Serializer;
  responseAdapter?: ResponseAdapter;
  globalGuards?: Array<Type<any>>;
  globalInterceptors?: Array<Type<any>>;
}

export interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean);
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
}

export interface WebSocketContext {
  ws: any;
  message: WebSocketMessage;
  userId?: string;
  metadata?: Map<string, any>;
  handshake?: HandshakeInfo;
  connectionId?: string;
}

export interface Guard {
  canActivate(
    context: WebSocketContext,
    message: WebSocketMessage
  ): boolean | Promise<boolean>;
}

export interface Interceptor {
  intercept(
    context: WebSocketContext,
    message: WebSocketMessage,
    next: () => Promise<any>
  ): any | Promise<any>;
}

export interface Serializer {
  serialize(value: any): string | Uint8Array;
  parse(input: string | Uint8Array | ArrayBuffer): any;
}

export interface ResponseAdapter {
  adaptSuccess(input: {
    type: string;
    id?: string | number;
    result: any;
  }): WebSocketResponse;
  adaptError(input: {
    type?: string;
    id?: string | number;
    error: unknown;
  }): WebSocketResponse;
}

export const METADATA_KEYS = {
  CONTROLLER: "mu:controller",
  METHOD: "mu:method",
  MODULE: "mu:module",
  INJECTABLE: "mu:injectable",
  INJECT: "mu:inject",
  PARAM_TYPES: "design:paramtypes",
  GUARDS: "mu:guards",
  INTERCEPTORS: "mu:interceptors",
  MIDDLEWARE: "mu:middleware",
} as const;

/**
 * Logger types (Nest.js 호환)
 */
export type LogLevel = "log" | "error" | "warn" | "debug" | "verbose";

export interface LoggerService {
  log(message: any, context?: string): any;
  error(message: any, trace?: string | Error, context?: string): any;
  warn(message: any, context?: string): any;
  debug?(message: any, context?: string): any;
  verbose?(message: any, context?: string): any;
  setLogLevels?(levels: LogLevel[]): void;
}

export interface LoggerOptions {
  /** 타임스탬프 출력 여부 및 형식 */
  timestamp?: boolean | "iso" | "local";
  /** ANSI 컬러 사용 여부 */
  colors?: boolean;
  /** JSON 포맷 출력 (true면 단일 라인 JSON) */
  json?: boolean;
  /** 레벨 배지/아이콘 사용 */
  symbols?: boolean;
  /** 객체 pretty print (indent 2) */
  prettyObjects?: boolean;
  /** 컨텍스트 강조 스타일 (brackets | at | none) */
  contextStyle?: "brackets" | "at" | "none";
}
