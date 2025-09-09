import { METADATA_KEYS } from "../types.ts";
import type { Interceptor, Serializer, ResponseAdapter } from "../types.ts";
import type {
  WebSocketMessage,
  WebSocketResponse,
  WebSocketContext,
  muApplicationOptions,
} from "../types.ts";
import { DIContainer } from "../di/container.ts";
import { getMetadata } from "../metadata/index.ts";
import { Logger } from "../logger/logger.ts";

export class muWebSocketServer {
  private server: any;
  private connections = new Map<any, WebSocketContext>();
  private messageHandlers = new Map<
    string,
    {
      controller: any;
      method: string;
      paramMetadata?: any[];
    }
  >();
  private serializer!: Serializer;
  private responseAdapter!: ResponseAdapter;

  constructor(
    private container: DIContainer,
    private options: muApplicationOptions = {}
  ) {
    this.options = {
      port: 3000,
      hostname: "localhost",
      debug: false,
      cors: true,
      ...options,
    };

    this.serializer = this.createSerializer(this.options.serializer);
    this.responseAdapter = this.createResponseAdapter(
      this.options.responseAdapter
    );
  }

  async start(): Promise<void> {
    this.registerHandlers();
    const serverOptions = {
      port: this.options.port,
      hostname: this.options.hostname,
      fetch: this.handleHttpRequest.bind(this),
      websocket: {
        message: this.handleMessage.bind(this),
        open: this.handleOpen.bind(this),
        close: this.handleClose.bind(this),
        error: this.handleError.bind(this),
        drain: this.handleDrain.bind(this),
        maxPayloadLength: this.options.maxPayloadLength,
        backpressureLimit: this.options.backpressureLimit,
        closeOnBackpressureLimit: this.options.closeOnBackpressureLimit,
        idleTimeout: this.options.idleTimeout,
        perMessageDeflate: this.options.perMessageDeflate,
      },
    };
    this.server = Bun.serve(serverOptions);
    Logger.log(
      `mu is running on ws://${this.options.hostname}:${this.options.port}`,
      "muServer"
    );
    if (this.options.debug) {
      Logger.debug(
        `Registered handlers: ${Array.from(this.messageHandlers.keys()).join(
          ", "
        )}`,
        "muServer"
      );
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      for (const [ws] of this.connections) {
        ws.close(1000, "Server shutting down");
      }
      this.connections.clear();
      this.server.stop();
      Logger.log("mu WebSocket Server stopped", "muServer");
    }
  }

  private handleHttpRequest(req: Request, server: any): Response {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          connections: this.connections.size,
          handlers: this.messageHandlers.size,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const upgraded = server.upgrade(req, {
      data: {
        url: url.toString(),
        headers: Object.fromEntries(req.headers.entries()),
        ip:
          req.headers.get("x-forwarded-for") ||
          req.headers.get("x-real-ip") ||
          undefined,
      },
    });
    if (upgraded) {
      return new Response(null, { status: 101 });
    }
    if (req.method === "OPTIONS" && this.options.cors) {
      return this.handleCors(req);
    }
    return new Response("mu WebSocket Server", {
      status: 426,
      headers: { Upgrade: "websocket" },
    });
  }

  private handleCors(req: Request): Response {
    const headers: Record<string, string> = {};
    if (typeof this.options.cors === "object") {
      const origin = req.headers.get("origin") || "*";
      if (this.options.cors.origin) {
        if (typeof this.options.cors.origin === "function") {
          headers["Access-Control-Allow-Origin"] = this.options.cors.origin(
            origin
          )
            ? origin
            : "";
        } else if (Array.isArray(this.options.cors.origin)) {
          headers["Access-Control-Allow-Origin"] =
            this.options.cors.origin.includes(origin) ? origin : "";
        } else {
          headers["Access-Control-Allow-Origin"] = this.options.cors.origin;
        }
      } else {
        headers["Access-Control-Allow-Origin"] = "*";
      }
      headers["Access-Control-Allow-Methods"] =
        this.options.cors.methods?.join(", ") || "GET, POST, OPTIONS";
      headers["Access-Control-Allow-Headers"] =
        this.options.cors.allowedHeaders?.join(", ") || "*";
      if (this.options.cors.credentials) {
        headers["Access-Control-Allow-Credentials"] = "true";
      }
    } else {
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
      headers["Access-Control-Allow-Headers"] = "*";
    }
    return new Response(null, { status: 204, headers });
  }

  private async handleOpen(ws: any): Promise<void> {
    const handshakeRaw = (ws as any).data || {};
    const handshakeUrl = String(handshakeRaw.url || "");
    const query: Record<string, string | string[]> = {};
    try {
      if (handshakeUrl) {
        const u = new URL(handshakeUrl);
        for (const [k, v] of u.searchParams.entries()) {
          if (query[k]) {
            const current = query[k];
            if (Array.isArray(current)) query[k] = [...current, v];
            else query[k] = [current as string, v];
          } else {
            query[k] = v;
          }
        }
      }
    } catch {}

    const connectionId =
      (globalThis as any).crypto?.randomUUID?.() ||
      `c_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    const context: WebSocketContext = {
      ws,
      message: { type: "" },
      metadata: new Map(),
      connectionId,
      handshake: {
        url: handshakeUrl,
        headers: (handshakeRaw.headers as Record<string, string>) || {},
        query,
        ip: handshakeRaw.ip as string | undefined,
      },
    };
    this.connections.set(ws, context);
    if (this.options.debug) {
      Logger.debug(
        `New connection established. Total: ${this.connections.size}`,
        "muServer"
      );
    }
    await this.executeLifecycleHandlers("on-connect", ws);
  }

  private async handleMessage(
    ws: any,
    message: string | Uint8Array | ArrayBuffer | string
  ): Promise<void> {
    const context = this.connections.get(ws);
    if (!context) return;
    let parsedId: string | number | undefined;
    let parsedType: string | undefined;
    try {
      const data: WebSocketMessage = this.serializer.parse(
        message as any
      ) as WebSocketMessage;
      parsedId = data.id;
      parsedType = data.type;
      context.message = data;

      if (this.options.debug) {
        Logger.debug(`Received message: ${data.type}`, "muServer");
      }

      const handler = this.messageHandlers.get(data.type);

      if (handler) {
        const result = await this.executeHandler(handler, context, data);

        if (result !== undefined) {
          const response = this.responseAdapter.adaptSuccess({
            type: data.type,
            id: data.id,
            result,
          });

          this.safeSend(ws, this.serializer.serialize(response));

          if (this.options.debug) {
            Logger.debug(`Sent response for: ${data.type}`, "muServer");
          }
        }
      } else {
        const errorResponse = this.responseAdapter.adaptError({
          type: data.type,
          id: data.id,
          error: `No handler found for message type: ${data.type}`,
        });

        this.safeSend(ws, this.serializer.serialize(errorResponse));

        if (this.options.debug) {
          Logger.warn(`No handler for message type: ${data.type}`, "muServer");
        }
      }
    } catch (error) {
      Logger.error("Error handling message:", error as any, "muServer");

      const errorResponse = this.responseAdapter.adaptError({
        type: parsedType,
        id: parsedId,
        error,
      });

      this.safeSend(ws, this.serializer.serialize(errorResponse));

      await this.executeLifecycleHandlers("on-error", ws, error as Error);
    }
  }

  private async handleClose(ws: any): Promise<void> {
    await this.executeLifecycleHandlers("on-disconnect", ws);

    this.connections.delete(ws);

    if (this.options.debug) {
      Logger.debug(
        `Connection closed. Total: ${this.connections.size}`,
        "muServer"
      );
    }
  }

  private async handleError(ws: any, error: Error): Promise<void> {
    Logger.error("WebSocket error:", error, "muServer");

    await this.executeLifecycleHandlers("on-error", ws, error);
  }

  private handleDrain(ws: any): void {
    if (this.options.debug) {
      Logger.debug("WebSocket backpressure released", "muServer");
    }
  }

  private registerHandlers(): void {
    const controllers = this.container.getAllControllers();

    for (const controller of controllers) {
      const constructor = controller.constructor;
      const prefix = getMetadata("mu:controller:prefix", constructor) || "";
      const methods = getMetadata(METADATA_KEYS.METHOD, constructor);

      if (methods instanceof Map) {
        for (const [methodName, metadata] of methods) {
          const eventType = prefix
            ? methodName.startsWith(`${prefix}.`)
              ? methodName
              : `${prefix}.${methodName}`
            : methodName;
          if (this.messageHandlers.has(eventType)) {
            throw new Error(
              `Duplicate handler for event "${eventType}" detected. Check controller: ${
                constructor.name
              } method: ${String(metadata.propertyKey)}`
            );
          }

          const paramMetadata = getMetadata(
            "mu:params",
            constructor,
            metadata.propertyKey
          );

          const classGuards =
            getMetadata(METADATA_KEYS.GUARDS, constructor) || [];
          const methodGuards =
            getMetadata(
              METADATA_KEYS.GUARDS,
              constructor,
              metadata.propertyKey
            ) || [];
          const classInterceptors =
            getMetadata(METADATA_KEYS.INTERCEPTORS, constructor) || [];
          const methodInterceptors =
            getMetadata(
              METADATA_KEYS.INTERCEPTORS,
              constructor,
              metadata.propertyKey
            ) || [];

          this.messageHandlers.set(eventType, {
            controller,
            method: String(metadata.propertyKey),
            paramMetadata,
            guards: [...classGuards, ...methodGuards],
            interceptors: [...classInterceptors, ...methodInterceptors],
          } as any);
        }
      }
    }
  }

  /**
   * 핸들러 실행
   */
  private async executeHandler(
    handler: {
      controller: any;
      method: string;
      paramMetadata?: any[];
      guards?: any[];
      interceptors?: any[];
    },
    context: WebSocketContext,
    message: WebSocketMessage
  ): Promise<any> {
    const { controller, method, paramMetadata } = handler as any;

    const params: any[] = [];

    if (paramMetadata) {
      for (let i = 0; i < paramMetadata.length; i++) {
        const meta = paramMetadata[i];
        if (!meta) {
          params.push(undefined);
          continue;
        }

        switch (meta.type) {
          case "payload":
            params.push(message.payload);
            break;
          case "message":
            params.push(message);
            break;
          case "socket":
            params.push(context.ws);
            break;
          case "context":
            params.push(context);
            break;
          case "headers":
            params.push(context.handshake?.headers || {});
            break;
          case "query":
            params.push(context.handshake?.query || {});
            break;
          case "ip":
            params.push(context.handshake?.ip);
            break;
          case "handshake":
            params.push(context.handshake);
            break;
          default:
            params.push(undefined);
        }
      }
    } else {
      params.push(message.payload);
    }

    const guardTokens: any[] = [
      ...((this.options.globalGuards as any[]) || []),
      ...(((handler as any).guards || []) as any[]),
    ];
    for (const token of guardTokens) {
      const guardInstance: any = (this.container as any).resolve(
        token,
        (context as any).connectionId
      );
      if (guardInstance && typeof guardInstance.canActivate === "function") {
        const allowed = await guardInstance.canActivate(context, message);
        if (!allowed) {
          return { success: false, error: "Forbidden" };
        }
      }
    }

    const interceptorTokens: any[] = [
      ...((this.options.globalInterceptors as any[]) || []),
      ...(((handler as any).interceptors || []) as any[]),
    ];
    const interceptors: Interceptor[] = interceptorTokens
      .map(
        (t) =>
          (this.container as any).resolve(
            t,
            (context as any).connectionId
          ) as Interceptor
      )
      .filter(
        (i: any): i is Interceptor => i && typeof i.intercept === "function"
      );

    const invokeController = async () => {
      return await controller[method](...params);
    };

    const executeWithInterceptors = async (index: number): Promise<any> => {
      if (index >= interceptors.length) {
        return invokeController();
      }
      const current = interceptors[index]! as Interceptor;
      return await current.intercept(context, message, () =>
        executeWithInterceptors(index + 1)
      );
    };

    return await executeWithInterceptors(0);
  }

  /**
   * 라이프사이클 핸들러 실행
   */
  private async executeLifecycleHandlers(
    type: "on-connect" | "on-disconnect" | "on-error",
    ws: any,
    error?: Error
  ): Promise<void> {
    const controllers = this.container.getAllControllers();

    for (const controller of controllers) {
      const methodName = getMetadata(`mu:${type}`, controller.constructor);

      if (methodName && typeof controller[methodName] === "function") {
        try {
          if (type === "on-error" && error) {
            await controller[methodName](ws, error);
          } else {
            await controller[methodName](ws);
          }
        } catch (err) {
          console.error(`Error in ${type} handler:`, err);
        }
      }
    }
  }

  /**
   * 모든 연결된 클라이언트에게 브로드캐스트
   */
  broadcast(message: WebSocketResponse): void {
    const data = this.serializer.serialize(message);

    for (const [ws] of this.connections) {
      this.safeSend(ws, data);
    }

    if (this.options.debug) {
      Logger.debug(
        `Broadcasted to ${this.connections.size} clients`,
        "muServer"
      );
    }
  }

  /**
   * 특정 조건의 클라이언트에게 메시지 전송
   */
  sendToClients(
    filter: (context: WebSocketContext) => boolean,
    message: WebSocketResponse
  ): void {
    const data = this.serializer.serialize(message);
    let count = 0;

    for (const [ws, context] of this.connections) {
      if (filter(context)) {
        if (this.safeSend(ws, data)) count++;
      }
    }

    if (this.options.debug) {
      Logger.debug(`Sent to ${count} filtered clients`, "muServer");
    }
  }

  private safeSend(ws: any, data: string | Uint8Array): boolean {
    try {
      ws.send(data as any);
      return true;
    } catch (e) {
      if (this.options.debug) {
        Logger.error("send failed:", e as any, "muServer");
      }
      try {
        ws.close(1011, "send failed");
      } catch {}
      this.connections.delete(ws);
      return false;
    }
  }

  private createSerializer(custom?: Serializer): Serializer {
    if (custom) return custom;
    return {
      serialize: (value: any) => JSON.stringify(value),
      parse: (input: any) => {
        if (typeof input === "string") return JSON.parse(input);
        if (input instanceof Uint8Array)
          return JSON.parse(new TextDecoder().decode(input));
        if (input instanceof ArrayBuffer)
          return JSON.parse(new TextDecoder().decode(new Uint8Array(input)));
        return JSON.parse(String(input));
      },
    } as Serializer;
  }

  private createResponseAdapter(custom?: ResponseAdapter): ResponseAdapter {
    if (custom) return custom;
    return {
      adaptSuccess: ({ type, id, result }) => {
        if (result && typeof result === "object" && !Array.isArray(result)) {
          return { type, id, success: true, ...(result as any) } as any;
        }
        return { type, id, success: true, data: result };
      },
      adaptError: ({ type, id, error }) => {
        const message =
          error instanceof Error ? error.message : String(error ?? "error");
        return { type, id, success: false, error: message };
      },
    } as ResponseAdapter;
  }
}
