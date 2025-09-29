# mu 프레임워크 공식 문서

이 문서는 mu 프레임워크의 사용법을 상세히 안내하여, 개발자가 프레임워크의 모든 기능을 최대한 활용할 수 있도록 돕는 것을 목표로 합니다.

이 문서는 Claude 4.1 Opus를 통해 작성되었습니다.

## 목차

1.  [소개](#1-소개)
    - [mu란?](#mu란)
    - [핵심 철학](#핵심-철학)
2.  [시작하기](#2-시작하기)
    - [프로젝트 설정](#프로젝트-설정)
    - [첫 번째 애플리케이션](#첫-번째-애플리케이션)
3.  [핵심 개념](#3-핵심-개념)
    - [모듈 (Modules)](#모듈-modules)
    - [컨트롤러 (Controllers)](#컨트롤러-controllers)
    - [프로바이더와 의존성 주입 (Providers-and-Dependency-Injection)](#프로바이더와-의존성-주입-providers-and-dependency-injection)
    - [가드 (Guards)](#가드-guards)
    - [인터셉터 (Interceptors)](#인터셉터-interceptors)
    - [생명주기 이벤트 (Lifecycle-Events)](#생명주기-이벤트-lifecycle-events)

---

## 1. 소개

### mu란?

mu는 [Bun](https://bun.sh/) 런타임을 위해 설계된 강력하고 효율적인 웹소켓(WebSocket) 프레임워크입니다. TypeScript를 완벽하게 지원하며, 모듈성, 확장성, 그리고 개발자 경험에 중점을 두고 개발되었습니다. mu는 NestJS와 같은 현대적인 프레임워크에서 영감을 받은 아키텍처를 채택하여, 개발자가 복잡한 실시간 애플리케이션을 체계적이고 유지보수하기 쉬운 방식으로 구축할 수 있도록 지원합니다.

### 핵심 철학

- **모듈성**: 애플리케이션을 기능 단위의 모듈로 분리하여 코드의 재사용성과 응집도를 높입니다.
- **의존성 주입 (DI)**: 제어의 역전(IoC) 원칙을 통해 컴포넌트 간의 결합도를 낮추고 테스트 용이성을 극대화합니다.
- **데코레이터 기반**: TypeScript 데코레이터를 적극적으로 활용하여 직관적이고 선언적인 방식으로 코드를 작성할 수 있습니다.
- **Bun 최적화**: Bun의 빠른 성능과 내장 기능들을 최대한 활용하여 최고의 성능을 제공합니다.

---

## 2. 시작하기

### 프로젝트 설정

mu를 사용하기 위해서는 먼저 Bun 런타임과 TypeScript 환경을 설정해야 합니다.

**1. Bun 설치**

아직 Bun이 설치되지 않았다면, 다음 명령어를 통해 설치합니다.

```bash
curl -fsSL https://bun.sh/install | bash
```

**2. 프로젝트 초기화 및 의존성 설치**

새로운 프로젝트 폴더를 만들고 Bun 프로젝트를 초기화합니다.

```bash
mkdir my-mu-app
cd my-mu-app
bun init
```

다음으로 mu 프레임워크를 설치 합니다.

```bash
bun add @torln/mu
```

**3. `tsconfig.json` 설정**

TypeScript 데코레이터를 사용하기 위해 `tsconfig.json` 파일에 다음 옵션을 활성화해야 합니다.

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
    // ... 기타 설정
  }
}
```

### 첫 번째 애플리케이션

이제 간단한 "ping-pong" 웹소켓 서버를 만들어 보겠습니다.

**1. `ping.service.ts` 생성**

요청에 "pong" 응답을 반환하는 간단한 서비스입니다. `@Injectable` 데코레이터는 이 클래스가 의존성 주입 컨테이너에 의해 관리될 수 있음을 나타냅니다.

```typescript
// src/ping/ping.service.ts
import { Injectable } from "@torln/mu";

@Injectable()
export class PingService {
  ping(name?: string): string {
    return `pong:${name || "anon"}`;
  }
}
```

**2. `ping.controller.ts` 생성**

`@Controller`는 웹소켓 이벤트를 처리하는 컨트롤러 클래스를 정의합니다. `@Method("ping")` 데코레이터는 `ping` 이벤트를 처리하는 핸들러를 지정합니다. 의존성 주입을 통해 `PingService`를 주입받아 사용합니다.

```typescript
// src/ping/ping.controller.ts
import { Controller, Method, Payload, Inject } from "@torln/mu";
import { PingService } from "./ping.service";

@Controller()
export class PingController {
  constructor(@Inject(PingService) private readonly pingService: PingService) {}

  @Method("ping")
  handlePing(@Payload() payload: { name?: string } = {}): { data: string } {
    const data = this.pingService.ping(payload.name);
    return { data };
  }
}
```

**3. `app.module.ts` 생성**

`@Module` 데코레이터는 애플리케이션의 구조를 정의하는 모듈을 선언합니다. `controllers`와 `providers` 배열에 위에서 만든 컨트롤러와 서비스를 등록합니다.

```typescript
// src/app.module.ts
import { Module } from "@torln/mu";
import { PingController } from "./ping/ping.controller";
import { PingService } from "./ping/ping.service";

@Module({
  controllers: [PingController],
  providers: [PingService],
})
export class AppModule {}
```

**4. `main.ts` (애플리케이션 진입점) 생성**

`createmuApp` 함수는 애플리케이션을 부트스트랩하고 웹소켓 서버를 시작합니다. 루트 모듈인 `AppModule`과 서버 설정을 인자로 전달합니다.

```typescript
// src/main.ts
import { createmuApp, Logger } from "@torln/mu";
import { AppModule } from "./app.module";

async function bootstrap() {
  await createmuApp(AppModule, {
    port: 3100,
    debug: true,
  });
  Logger.log("mu application is running on ws://localhost:3100", "Bootstrap");
}

bootstrap();
```

**5. 애플리케이션 실행**

다음 명령어로 애플리케이션을 실행합니다.

```bash
bun --hot src/main.ts
```

이제 웹소켓 클라이언트를 사용하여 `ws://localhost:3100`에 접속하고, 다음과 같은 형식의 메시지를 보내 테스트할 수 있습니다.

```json
{
  "type": "ping",
  "payload": { "name": "Mu" }
}
```

서버는 다음과 같이 응답할 것입니다.

```json
{
  "data": "pong:Mu"
}
```

---

## 3. 핵심 개념

mu 프레임워크의 핵심 아키텍처를 구성하는 주요 요소들입니다.

### 모듈 (Modules)

모듈은 `@Module()` 데코레이터로 주석이 달린 클래스입니다. 모듈은 애플리케이션의 구조를 조직화하는 데 사용됩니다. 각 애플리케이션에는 최소 하나 이상의 모듈, 즉 루트 모듈이 있습니다.

`@Module()` 데코레이터는 다음과 같은 속성을 가진 객체를 인자로 받습니다.

- `imports`: 이 모듈에서 필요한 프로바이더를 내보내는 다른 모듈의 배열.
- `controllers`: 이 모듈에서 인스턴스화되어야 하는 컨트롤러의 배열.
- `providers`: DI 컨테이너에 의해 인스턴스화되고 이 모듈 전체에서 공유될 수 있는 프로바이더의 배열.
- `exports`: 이 모듈에서 제공하는 프로바이더 중 다른 모듈에서 사용할 수 있도록 공개할 프로바이더의 하위 집합.

**예시:**

`example/AppModule.ts` 파일은 `PingController`와 `CatsController`를 컨트롤러로, `PingService`와 `CatsService`를 프로바이더로 등록하고, `AdvancedModule`을 임포트하는 루트 모듈의 좋은 예시입니다.

```typescript
// example/AppModule.ts
import { Module } from "@torln/mu";
import { PingController } from "./ping/ping.controller";
import { PingService } from "./ping/ping.service";
import { CatsController } from "./cat/cats.controller";
import { CatsService } from "./cat/cats.service";
import { AdvancedModule } from "./advanced/advanced.module";

@Module({
  imports: [AdvancedModule],
  controllers: [PingController, CatsController],
  providers: [PingService, CatsService],
})
export class AppModule {}
```

### 컨트롤러 (Controllers)

컨트롤러는 들어오는 웹소켓 메시지를 처리하고 클라이언트에게 응답을 반환하는 역할을 합니다.

- **`@Controller(prefix?)`**: 클래스가 컨트롤러임을 선언합니다. 선택적으로 prefix를 지정할 수 있습니다.
- **`@Method(eventName)`**: 특정 `eventName`을 가진 메시지를 처리하는 메서드를 지정합니다. 클라이언트가 보내는 메시지 객체는 `{ "type": "eventName", "payload": { ... } }` 형식을 따라야 합니다.

#### 파라미터 데코레이터

mu는 다양한 파라미터 데코레이터를 제공하여 메서드 핸들러에서 필요한 정보를 주입받을 수 있습니다:

- **`@Payload()`**: 메시지의 `payload` 부분을 메서드의 인자로 주입합니다.
- **`@Message()`**: 전체 메시지 객체를 주입합니다.
- **`@Socket()`**: WebSocket 연결 객체를 주입합니다.
- **`@Context()`**: WebSocket 컨텍스트 객체를 주입합니다.
- **`@Headers()`**: 핸드셰이크 시의 HTTP 헤더들을 주입합니다.
- **`@Query()`**: URL 쿼리 파라미터들을 주입합니다.
- **`@Ip()`**: 클라이언트 IP 주소를 주입합니다.
- **`@Handshake()`**: 전체 핸드셰이크 정보를 주입합니다.

**예시:**

```typescript
import {
  Controller,
  Method,
  Payload,
  Message,
  Socket,
  Context,
  Headers,
  Query,
  Ip,
} from "@torln/mu";

@Controller()
export class AdvancedController {
  @Method("test")
  handleTest(
    @Payload() payload: any,
    @Message() message: WebSocketMessage,
    @Headers() headers: Record<string, string>,
    @Query() query: Record<string, string | string[]>,
    @Ip() ip: string | undefined
  ) {
    console.log("Payload:", payload);
    console.log("Full message:", message);
    console.log("Headers:", headers);
    console.log("Query params:", query);
    console.log("Client IP:", ip);
    return { success: true };
  }
}
```

**예시:**

`ping.controller.ts`는 `ping` 이벤트를 처리하는 `handlePing` 메서드를 정의합니다.

```typescript
// example/ping/ping.controller.ts
import { Controller, Method, Payload, Inject } from "@torln/mu";
import { PingService } from "./ping.service";

@Controller()
export class PingController {
  constructor(@Inject(PingService) private readonly pingService: PingService) {}

  @Method("ping")
  handlePing(@Payload() payload: { name?: string } = {}): { data: string } {
    const data = this.pingService.ping(payload.name);
    return { data };
  }
}
```

### 프로바이더와 의존성 주입 (Providers and Dependency Injection)

프로바이더는 mu 프레임워크의 핵심 개념 중 하나입니다. 서비스, 리포지토리, 팩토리, 헬퍼 등 대부분의 클래스는 프로바이더로 취급될 수 있습니다. 프로바이더의 주된 아이디어는 **의존성으로 주입**될 수 있다는 것입니다.

- **`@Injectable()`**: 클래스가 mu의 DI 컨테이너에 의해 관리될 수 있는 프로바이더임을 선언합니다.
- **`@Inject(token)`**: 생성자 파라미터에 사용하여 프로바이더를 주입합니다. `token`은 보통 클래스 이름 자체입니다.

mu는 생성자 기반 의존성 주입을 사용합니다. 이를 통해 클래스 간의 결합도를 낮추고 코드의 테스트 용이성을 높일 수 있습니다.

**예시:**

`PingService`는 `@Injectable`로 선언되어 있으며, `PingController`의 생성자에서 `@Inject(PingService)`를 통해 주입됩니다.

```typescript
// example/ping/ping.service.ts
import { Injectable } from "@torln/mu";

@Injectable()
export class PingService {
  ping(name?: string): string {
    return `pong:${name || "anon"}`;
  }
}

// example/ping/ping.controller.ts
@Controller()
export class PingController {
  constructor(@Inject(PingService) private readonly pingService: PingService) {}
  // ...
}
```

### 가드 (Guards)

가드는 단일 책임을 갖는 클래스입니다. 특정 조건(예: 권한, 역할, ACL 등)에 따라 특정 요청을 처리할지 여부를 결정합니다. 가드는 `Guard` 인터페이스를 구현하고 `canActivate` 메서드를 제공해야 합니다.

`canActivate` 메서드는 `boolean` 또는 `Promise<boolean>`을 반환해야 합니다. `false`를 반환하면 해당 요청 처리가 거부됩니다. `true`를 반환하면 요청이 처리됩니다.

**예시:**

`HeaderGuard`는 웹소켓 연결 핸드셰이크 과정에서 특정 헤더(`x-mu-demo`)가 있는지 확인합니다.

```typescript
// example/advanced/header.guard.ts
import { Injectable, type Guard, Logger } from "@torln/mu";

@Injectable()
export class HeaderGuard implements Guard {
  private readonly logger = new Logger("HeaderGuard");
  async canActivate(context: any, message: any): Promise<boolean> {
    const headers = context?.handshake?.headers || {};
    const ok = headers["x-mu-demo"] === "ok";
    if (!ok) this.logger.warn("blocked by HeaderGuard");
    return ok;
  }
}
```

가드는 전역(global), 컨트롤러(controller), 또는 메서드(method) 범위에 적용할 수 있습니다.

**1. 전역 가드 (Global Guard)**

애플리케이션 전체에 적용되며, `createmuApp`의 설정 객체를 통해 등록합니다.

```typescript
// main.ts
await createmuApp(AppModule, {
  // ...
  globalGuards: [HeaderGuard],
});
```

**2. 컨트롤러/메서드 가드**

`@UseGuards()` 데코레이터를 사용하여 특정 컨트롤러나 메서드에 가드를 적용할 수 있습니다.

```typescript
import { UseGuards } from "@torln/mu";
import { HeaderGuard } from "./header.guard";

@Controller()
@UseGuards(HeaderGuard) // 이 컨트롤러의 모든 메서드에 HeaderGuard 적용
export class RoomController {
  @Method("join-room")
  @UseGuards(AnotherGuard) // 이 메서드에만 AnotherGuard 추가 적용
  handleJoinRoom(@Payload() payload: any) {
    // ...
  }
}
```

### 인터셉터 (Interceptors)

인터셉터는 `@Injectable()` 데코레이터로 주석이 달린 클래스이며, `Interceptor` 인터페이스를 구현합니다. 인터셉터는 다음과 같은 기능을 통해 AOP(Aspect-Oriented Programming)에서 영감을 받은 강력한 기능을 제공합니다.

- 메서드 실행 전/후에 추가 로직 바인딩
- 메서드에서 반환된 결과 변환
- 메서드에서 발생하는 예외 변환
- 메서드의 기본 동작 확장

인터셉터는 `intercept` 메서드를 구현해야 하며, 이 메서드는 `context`, `message`, 그리고 `next` 함수를 인자로 받습니다. `next()`를 호출하면 핸들러 메서드가 실행됩니다.

**예시:**

`LoggingInterceptor`는 메시지 처리 전후로 로그를 남깁니다.

```typescript
// example/advanced/logging.interceptor.ts
import { Injectable, type Interceptor, Logger } from "@torln/mu";

@Injectable()
export class LoggingInterceptor implements Interceptor {
  private readonly logger = new Logger("LoggingInterceptor");
  async intercept(context: any, message: any, next: () => Promise<any>) {
    const start = Date.now();
    this.logger.debug({ event: message?.type, phase: "before" });
    try {
      const result = await next();
      const ms = Date.now() - start;
      this.logger.debug({ event: message?.type, phase: "after", ms });
      return result;
    } catch (e) {
      const ms = Date.now() - start;
      this.logger.error("intercept error", e as any);
      this.logger.debug({ event: message?.type, phase: "error", ms });
      throw e;
    }
  }
}
```

인터셉터 또한 가드처럼 전역, 컨트롤러, 메서드 범위에 적용할 수 있습니다.

**1. 전역 인터셉터 (Global Interceptor)**

`createmuApp`의 설정 객체를 통해 등록합니다.

```typescript
// main.ts
await createmuApp(AppModule, {
  // ...
  globalInterceptors: [LoggingInterceptor],
});
```

**2. 컨트롤러/메서드 인터셉터**

`@UseInterceptors()` 데코레이터를 사용하여 특정 컨트롤러나 메서드에 인터셉터를 적용합니다.

```typescript
import { UseInterceptors } from "@torln/mu";
import { LoggingInterceptor } from "./logging.interceptor";

@Controller()
@UseInterceptors(LoggingInterceptor) // 이 컨트롤러 전체에 적용
export class EchoController {
  @Method("echo")
  @UseInterceptors(AnotherInterceptor) // 이 메서드에 추가 적용
  handleEcho(@Payload() payload: any): any {
    return payload;
  }
}
```

### 생명주기 이벤트 (Lifecycle Events)

mu는 컨트롤러 내에서 웹소켓 연결의 생명주기 이벤트를 처리할 수 있는 데코레이터를 제공합니다.

- **`@OnConnect()`**: 클라이언트가 성공적으로 연결되었을 때 호출됩니다.
- **`@OnDisconnect()`**: 클라이언트 연결이 끊어졌을 때 호출됩니다.
- **`@OnError()`**: 에러가 발생했을 때 호출됩니다.

**주의**: TypeScript 타입 정의에서 `OnDisconnect`는 실제로 `OnDisconnection`으로 export됩니다. 타입을 import할 때는 `OnDisconnection`을 사용해야 합니다.

**예시:**

```typescript
// example/ping/ping.controller.ts
@Controller()
export class PingController {
  // ...
  @OnConnect()
  onConnect(): void {
    console.log("onConnect: client connected");
  }

  @OnDisconnect()
  onDisconnect(): void {
    console.log("onDisconnect: client disconnected");
  }

  @OnError()
  onError(_ws: any, error: Error): void {
    console.error("onError:", error.message);
  }
  // ...
}
```

---

## 4. 고급 개념

### 프로바이더 스코프 (Provider Scope)

기본적으로 대부분의 프로바이더는 싱글턴(singleton) 스코프에서 동작합니다. 즉, 애플리케이션 생명주기 동안 단 하나의 인스턴스만 생성되고 공유됩니다. 하지만 특정 상황에서는 다른 스코프가 필요할 수 있습니다.

mu는 현재 두 가지 프로바이더 스코프를 지원합니다.

1.  **`singleton` (기본값)**: 애플리케이션 전체에서 단일 인스턴스를 공유합니다.
2.  **`connection`**: 각 클라이언트 연결마다 새로운 인스턴스가 생성됩니다. 이는 연결별로 상태를 유지해야 하는 경우에 유용합니다.

스코프를 지정하려면 모듈의 `providers` 배열에 표준 클래스 대신 확장된 프로바이더 구문을 사용해야 합니다.

**예시:**

`LoggingInterceptor`와 `ConnectionScopedService`를 `connection` 스코프로 등록하는 예시입니다.

```typescript
// example/advanced/advanced.module.ts
import { Module } from "@/index.ts";
import { LoggingInterceptor } from "./logging.interceptor.ts";
import { ConnectionScopedService } from "./scoped.service.ts";

@Module({
  // ...
  providers: [
    {
      provide: LoggingInterceptor,
      useClass: LoggingInterceptor,
      scope: "connection",
    },
    {
      provide: ConnectionScopedService,
      useClass: ConnectionScopedService,
      scope: "connection",
    },
  ],
})
export class AdvancedModule {}
```

### 커스텀 프로바이더 (Custom Providers)

단순히 클래스를 주입하는 것을 넘어, 값(value)이나 팩토리(factory) 함수를 사용하는 더 유연한 방식의 프로바이더 등록도 가능합니다.

**1. 값 프로바이더 (`useValue`)**

정적인 값, 설정 객체 등을 주입해야 할 때 유용합니다. `provide` 속성에는 주입 토큰(일반적으로 문자열 또는 심볼)을, `useValue`에는 주입할 값을 지정합니다.

**2. 팩토리 프로바이더 (`useFactory`)**

동적인 로직을 통해 프로바이더를 생성해야 할 때 사용합니다. `useFactory` 속성에 함수를 제공하며, `inject` 배열을 통해 이 팩토리 함수가 의존하는 다른 프로바이더를 주입받을 수 있습니다.

**예시:**

`CONFIG` 토큰으로 설정 객체를 `useValue`로 제공하고, 이 설정을 주입받아 동적으로 `BANNER` 값을 생성하는 `useFactory` 프로바이더 예시입니다.

```typescript
// example/tokens.ts
export const CONFIG = Symbol("CONFIG");
export const BANNER = Symbol("BANNER");

export interface Config {
  greeting: string;
}

// example/advanced/advanced.module.ts
@Module({
  providers: [
    { provide: CONFIG, useValue: { greeting: "hello, mu" } as Config },
    {
      provide: BANNER,
      useFactory: (cfg: Config) => `${cfg.greeting} - advanced demo`,
      inject: [CONFIG],
    },
  ],
})
export class AdvancedModule {}

// 사용 예시
import { Inject } from "@torln/mu";
import { BANNER } from "../tokens.ts";

@Injectable()
export class EchoService {
  constructor(@Inject(BANNER) private readonly banner: string) {
    console.log(this.banner); // "hello, mu - advanced demo" 출력
  }
}
```

## 5. 서버 메서드

mu는 WebSocket 서버 인스턴스를 통해 클라이언트와의 통신을 관리하는 여러 유용한 메서드를 제공합니다.

### broadcast

연결된 모든 클라이언트에게 메시지를 전송합니다.

```typescript
// main.ts
const app = await createmuApp(AppModule, { port: 3100 });
const server = app.getServer();

// 모든 클라이언트에게 브로드캐스트
server.broadcast({
  type: "announcement",
  data: "Server will restart in 5 minutes",
});
```

### sendToClients

특정 조건을 만족하는 클라이언트들에게만 메시지를 전송합니다.

```typescript
const server = app.getServer();

// 특정 사용자 ID를 가진 클라이언트에게만 전송
server.sendToClients(
  (context) => context.metadata?.get("userId") === "user123",
  {
    type: "private-message",
    data: "This is for you only",
  }
);

// 특정 room에 속한 클라이언트들에게 전송
server.sendToClients((context) => context.metadata?.get("room") === "room1", {
  type: "room-message",
  data: "Message to all room members",
});
```

### WebSocketContext

각 연결은 다음과 같은 속성을 가진 컨텍스트 객체를 가집니다:

- `ws`: WebSocket 연결 객체
- `message`: 현재 처리 중인 메시지
- `metadata`: 연결별 메타데이터를 저장하는 Map
- `connectionId`: 고유한 연결 ID
- `handshake`: 핸드셰이크 정보 (url, headers, query, ip)

## 6. Logger 설정

mu는 강력한 로깅 시스템을 제공합니다. 로거는 다양한 방식으로 구성할 수 있습니다.

### 로그 레벨

다음 로그 레벨을 사용할 수 있습니다:

- `log`: 일반 로그
- `error`: 에러 메시지
- `warn`: 경고 메시지
- `debug`: 디버그 정보
- `verbose`: 상세 정보

### 로거 설정 옵션

```typescript
await createmuApp(AppModule, {
  port: 3100,
  debug: true, // debug와 verbose 로그 활성화
  logLevels: ["log", "error", "warn", "debug"], // 활성화할 로그 레벨 지정
  loggerOptions: {
    timestamp: "iso", // 'iso' | 'local' | boolean
    colors: true, // ANSI 색상 사용
    json: false, // JSON 형식 출력
    symbols: true, // 레벨 배지/아이콘 사용
    prettyObjects: true, // 객체 pretty print
    contextStyle: "brackets", // 'brackets' | 'at' | 'none'
  },
});
```

### 컨텍스트별 로거

```typescript
import { Logger } from "@torln/mu";

export class MyService {
  private readonly logger = new Logger("MyService");

  doSomething() {
    this.logger.log("Processing...");
    this.logger.debug({ data: "debug info" });
    this.logger.error("Something went wrong", error);
  }
}
```

## 7. Serializer와 ResponseAdapter

### 커스텀 Serializer

JSON 대신 다른 형식을 사용하려면 커스텀 Serializer를 구현할 수 있습니다:

```typescript
import { Serializer } from "@torln/mu";

class MessagePackSerializer implements Serializer {
  serialize(value: any): Uint8Array {
    // MessagePack으로 직렬화
    return msgpack.encode(value);
  }

  parse(input: string | Uint8Array | ArrayBuffer): any {
    // MessagePack에서 역직렬화
    if (typeof input === "string") {
      input = new TextEncoder().encode(input);
    }
    return msgpack.decode(input);
  }
}

await createmuApp(AppModule, {
  serializer: new MessagePackSerializer(),
});
```

### 커스텀 ResponseAdapter

응답 형식을 커스터마이징하려면 ResponseAdapter를 구현합니다:

```typescript
import { ResponseAdapter, WebSocketResponse } from "@torln/mu";

class CustomResponseAdapter implements ResponseAdapter {
  adaptSuccess({ type, id, result }): WebSocketResponse {
    return {
      type,
      id,
      status: "success",
      payload: result,
      timestamp: new Date().toISOString(),
    };
  }

  adaptError({ type, id, error }): WebSocketResponse {
    return {
      type,
      id,
      status: "error",
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}

await createmuApp(AppModule, {
  responseAdapter: new CustomResponseAdapter(),
});
```

## 8. 메타데이터 관리

mu는 TypeScript의 reflect-metadata를 사용하여 메타데이터를 관리합니다. 다음과 같은 유틸리티 함수들을 제공합니다:

- `getMetadata(key, target, propertyKey?)`: 메타데이터 조회
- `defineMetadata(key, value, target, propertyKey?)`: 메타데이터 정의
- `hasMetadata(key, target, propertyKey?)`: 메타데이터 존재 확인
- `getOwnMetadata(key, target, propertyKey?)`: 자체 메타데이터 조회
- `getParamTypes(target, propertyKey)`: 파라미터 타입 조회
- `setParamTypes(types, target, propertyKey)`: 파라미터 타입 설정

## 9. 추가 설정 옵션

mu는 WebSocket 서버의 세부 동작을 제어하는 다양한 설정 옵션을 제공합니다:

```typescript
await createmuApp(AppModule, {
  port: 3100,
  hostname: "localhost",
  maxPayloadLength: 16 * 1024 * 1024, // 최대 페이로드 크기 (16MB)
  backpressureLimit: 1024 * 1024, // 백프레셔 제한
  closeOnBackpressureLimit: false, // 백프레셔 제한 도달 시 연결 종료 여부
  idleTimeout: 120, // 유휴 타임아웃 (초)
  perMessageDeflate: true, // 메시지 압축 사용
  cors: {
    origin: ["http://localhost:3000", "https://example.com"],
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Custom-Header"],
    maxAge: 86400,
  },
});
```
