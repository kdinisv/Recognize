# Recognize

<p align="center">
  <img src="https://raw.githubusercontent.com/kdinisv/Recognize/master/logo.png" alt="Recognize" width="200">
</p>

<p align="center">
  <b>Captcha solving library for Node.js</b>
</p>

**[English](#english)** | **[Русский](#русский)**

---

## English

Lightweight zero-dependency captcha solving client for **[RuCaptcha](https://rucaptcha.com/auth/register/?from=1027759)** and **[Anti-Captcha](https://getcaptchasolution.com/mt3qolfnab)** services (API v2).

- **0 runtime dependencies** — uses native `fetch` (Node.js 18+)
- **TypeScript** — full type safety, autocompletion, exported types
- **Dual ESM/CJS** — works with `import` and `require`
- **30+ captcha types** — reCAPTCHA, hCaptcha, Turnstile, FunCaptcha, GeeTest, and more
- **Auto-polling** — waits for result with configurable interval & timeout

### Install

```bash
npm install recognize
```

### Quick Start

```ts
import { RuCaptcha } from "recognize";

const solver = new RuCaptcha({
  apiKey: "YOUR_API_KEY",
  pollingInterval: 5000, // optional, default 5000ms
  timeout: 180000, // optional, default 180000ms
});

// Check balance
const balance = await solver.getBalance();
console.log("Balance:", balance);

// Solve reCAPTCHA v2
const { taskId, solution } = await solver.recaptchaV2(
  "https://example.com",
  "SITE_KEY",
);
console.log(solution.gRecaptchaResponse);

// Report result
await solver.reportCorrect(taskId);
```

### Anti-Captcha

```ts
import { AntiCaptcha } from "recognize";

const solver = new AntiCaptcha({ apiKey: "YOUR_API_KEY" });
```

### Dynamic service selection

```ts
import { createSolver } from "recognize";

const solver = createSolver("rucaptcha", { apiKey: "YOUR_API_KEY" });
// or
const solver2 = createSolver("anticaptcha", { apiKey: "YOUR_API_KEY" });
```

### Constructor Options

| Option            | Type     | Default  | Description                  |
| ----------------- | -------- | -------- | ---------------------------- |
| `apiKey`          | `string` | —        | **Required.** API key        |
| `pollingInterval` | `number` | `5000`   | Polling interval in ms       |
| `timeout`         | `number` | `180000` | Max wait time per task in ms |

### API

All solving methods return `Promise<TaskResult<T>>` where `TaskResult<T> = { taskId: number, solution: T }`.

### Account

| Method                    | Description               |
| ------------------------- | ------------------------- |
| `getBalance()`            | Get account balance       |
| `reportCorrect(taskId)`   | Report correct solution   |
| `reportIncorrect(taskId)` | Report incorrect solution |

### Image & Text

| Method                         | Params                                            | Task Type         |
| ------------------------------ | ------------------------------------------------- | ----------------- |
| `imageCaptcha(body, options?)` | `body` — Buffer or base64 string                  | `ImageToTextTask` |
| `textCaptcha(text, options?)`  | `text` — question string                          | `TextCaptchaTask` |
| `audioCaptcha(body, lang?)`    | `body` — Buffer or base64, `lang` — language code | `AudioTask`       |

### reCAPTCHA

| Method                                                   | Params                             |
| -------------------------------------------------------- | ---------------------------------- |
| `recaptchaV2(url, siteKey, options?)`                    | Supports proxy via `options.proxy` |
| `recaptchaV3(url, siteKey, action, minScore?, options?)` | `minScore` default `0.3`           |
| `recaptchaV2Enterprise(url, siteKey, options?)`          | Enterprise version                 |

### hCaptcha

```ts
await solver.hcaptcha(url, siteKey, options?)
```

### Cloudflare Turnstile

```ts
await solver.turnstile(url, siteKey, options?)
```

### FunCaptcha (Arkose Labs)

```ts
await solver.funcaptcha(url, publicKey, options?)
```

### GeeTest

```ts
await solver.geetest(url, gt, challenge, options?)
await solver.geetestV4(url, captchaId, options?)
```

### Amazon WAF

```ts
await solver.amazonWaf(url, siteKey, options?)
```

### Other Captcha Types

| Method                                                   | Task Type                         |
| -------------------------------------------------------- | --------------------------------- |
| `keyCaptcha(url, options?)`                              | `KeyCaptchaTaskProxyless`         |
| `lemin(url, captchaId, apiServer, options?)`             | `LeminTaskProxyless`              |
| `capyPuzzle(url, siteKey, options?)`                     | `CapyTaskProxyless`               |
| `dataDome(url, captchaUrl, userAgent, proxyConfig)`      | `DataDomeSliderTask`              |
| `cyberSiara(url, slideMasterUrlId, userAgent, options?)` | `AntiCyberSiAraTaskProxyless`     |
| `mtCaptcha(url, siteKey, options?)`                      | `MtCaptchaTaskProxyless`          |
| `friendlyCaptcha(url, siteKey, options?)`                | `FriendlyCaptchaTaskProxyless`    |
| `cutcaptcha(url, miseryKey, apiKey, options?)`           | `CutCaptchaTaskProxyless`         |
| `tencent(url, appId, options?)`                          | `TencentTaskProxyless`            |
| `atbCaptcha(url, appId, apiServer, options?)`            | `AtbCaptchaTaskProxyless`         |
| `yandexSmart(url, siteKey, options?)`                    | `YandexSmartCaptchaTaskProxyless` |
| `vkCaptcha(url, siteKey, options?)`                      | `VKCaptchaTaskProxyless`          |
| `temuCaptcha(url, options?)`                             | `TemuCaptchaTaskProxyless`        |

### Image-Based Tasks

| Method                               | Task Type         |
| ------------------------------------ | ----------------- |
| `rotateCaptcha(body, options?)`      | `RotateTask`      |
| `coordinatesCaptcha(body, options?)` | `CoordinatesTask` |
| `gridCaptcha(body, options?)`        | `GridTask`        |
| `boundingBoxCaptcha(body, options?)` | `BoundingBoxTask` |
| `drawAroundCaptcha(body, options?)`  | `DrawAroundTask`  |

### Generic / Custom

```ts
// Send any task type directly
await solver.solve<{ token: string }>({
  type: "SomeNewTaskType",
  websiteURL: "https://example.com",
});
```

### Proxy Support

Methods that support proxy accept it via options:

```ts
await solver.recaptchaV2("https://example.com", "SITE_KEY", {
  proxyType: "http",
  proxyAddress: "1.2.3.4",
  proxyPort: 8080,
  proxyLogin: "user",
  proxyPassword: "pass",
  proxy: true,
});
```

### Exported Types

```ts
import type {
  SolverOptions,
  TaskResult,
  TokenSolution,
  GRecaptchaSolution,
  ImageSolution,
  GeeTestSolution,
  GeeTestV4Solution,
  ProxyOptions,
  RecaptchaV2Options,
  HCaptchaOptions,
  TurnstileOptions,
  // ... and more
} from "recognize";
```

### Migration from v2

| v2 (old)                                | v3 (current)                    |
| --------------------------------------- | ------------------------------- |
| `new Recognize(SOURCE.RUCAPTCHA, {})`   | `new RuCaptcha({ apiKey })`     |
| `new Recognize(SOURCE.ANTICAPTCHA, {})` | `new AntiCaptcha({ apiKey })`   |
| `{ key: "..." }`                        | `{ apiKey: "..." }`             |
| `balanse()`                             | `getBalance()`                  |
| `solvingImage(buff)`                    | `imageCaptcha(buff)`            |
| `solvingRecaptcha2()`                   | `recaptchaV2(url, key)`         |
| `solvingRecaptcha3()`                   | `recaptchaV3(url, key, action)` |
| `reportGood(id)`                        | `reportCorrect(taskId)`         |
| `reportBad(id)`                         | `reportIncorrect(taskId)`       |
| return `{ id, result }`                 | return `{ taskId, solution }`   |

### License

See [LICENSE](LICENSE) file.

---

## Русский

Лёгкий клиент для решения капч без сторонних зависимостей. Поддерживает сервисы **[RuCaptcha](https://rucaptcha.com/auth/register/?from=1027759)** и **[Anti-Captcha](https://getcaptchasolution.com/mt3qolfnab)** (API v2).

- **0 зависимостей** — использует встроенный `fetch` (Node.js 18+)
- **TypeScript** — полная типизация, автодополнение, экспортируемые типы
- **Dual ESM/CJS** — работает с `import` и `require`
- **30+ типов капч** — reCAPTCHA, hCaptcha, Turnstile, FunCaptcha, GeeTest и другие
- **Автополлинг** — ожидает результат с настраиваемым интервалом и таймаутом

### Установка

```bash
npm install recognize
```

### Быстрый старт

```ts
import { RuCaptcha } from "recognize";

const solver = new RuCaptcha({
  apiKey: "ВАШ_API_КЛЮЧ",
  pollingInterval: 5000, // опционально, по умолчанию 5000 мс
  timeout: 180000, // опционально, по умолчанию 180000 мс
});

// Проверить баланс
const balance = await solver.getBalance();
console.log("Баланс:", balance);

// Решить reCAPTCHA v2
const { taskId, solution } = await solver.recaptchaV2(
  "https://example.com",
  "SITE_KEY",
);
console.log(solution.gRecaptchaResponse);

// Сообщить о результате
await solver.reportCorrect(taskId);
```

#### Anti-Captcha

```ts
import { AntiCaptcha } from "recognize";

const solver = new AntiCaptcha({ apiKey: "ВАШ_API_КЛЮЧ" });
```

#### Динамический выбор сервиса

```ts
import { createSolver } from "recognize";

const solver = createSolver("rucaptcha", { apiKey: "ВАШ_API_КЛЮЧ" });
// или
const solver2 = createSolver("anticaptcha", { apiKey: "ВАШ_API_КЛЮЧ" });
```

### Параметры конструктора

| Параметр          | Тип      | По умолчанию | Описание                              |
| ----------------- | -------- | ------------ | ------------------------------------- |
| `apiKey`          | `string` | —            | **Обязательный.** API ключ            |
| `pollingInterval` | `number` | `5000`       | Интервал опроса в мс                  |
| `timeout`         | `number` | `180000`     | Максимальное время ожидания задачи мс |

### API

Все методы решения капч возвращают `Promise<TaskResult<T>>`, где `TaskResult<T> = { taskId: number, solution: T }`.

#### Аккаунт

| Метод                     | Описание                    |
| ------------------------- | --------------------------- |
| `getBalance()`            | Получить баланс аккаунта    |
| `reportCorrect(taskId)`   | Сообщить о верном решении   |
| `reportIncorrect(taskId)` | Сообщить о неверном решении |

#### Изображения и текст

| Метод                          | Параметры                                                   | Тип задачи        |
| ------------------------------ | ----------------------------------------------------------- | ----------------- |
| `imageCaptcha(body, options?)` | `body` — Buffer или строка base64                           | `ImageToTextTask` |
| `textCaptcha(text, options?)`  | `text` — строка с вопросом                                  | `TextCaptchaTask` |
| `audioCaptcha(body, lang?)`    | `body` — Buffer или base64, `lang` — код языка (`ru`, `en`) | `AudioTask`       |

#### reCAPTCHA

| Метод                                                    | Параметры                              |
| -------------------------------------------------------- | -------------------------------------- |
| `recaptchaV2(url, siteKey, options?)`                    | Поддержка прокси через `options.proxy` |
| `recaptchaV3(url, siteKey, action, minScore?, options?)` | `minScore` по умолчанию `0.3`          |
| `recaptchaV2Enterprise(url, siteKey, options?)`          | Enterprise версия                      |

#### hCaptcha

```ts
await solver.hcaptcha(url, siteKey, options?)
```

#### Cloudflare Turnstile

```ts
await solver.turnstile(url, siteKey, options?)
```

#### FunCaptcha (Arkose Labs)

```ts
await solver.funcaptcha(url, publicKey, options?)
```

#### GeeTest

```ts
await solver.geetest(url, gt, challenge, options?)
await solver.geetestV4(url, captchaId, options?)
```

#### Amazon WAF

```ts
await solver.amazonWaf(url, siteKey, options?)
```

#### Другие типы капч

| Метод                                                    | Тип задачи                        |
| -------------------------------------------------------- | --------------------------------- |
| `keyCaptcha(url, options?)`                              | `KeyCaptchaTaskProxyless`         |
| `lemin(url, captchaId, apiServer, options?)`             | `LeminTaskProxyless`              |
| `capyPuzzle(url, siteKey, options?)`                     | `CapyTaskProxyless`               |
| `dataDome(url, captchaUrl, userAgent, proxyConfig)`      | `DataDomeSliderTask`              |
| `cyberSiara(url, slideMasterUrlId, userAgent, options?)` | `AntiCyberSiAraTaskProxyless`     |
| `mtCaptcha(url, siteKey, options?)`                      | `MtCaptchaTaskProxyless`          |
| `friendlyCaptcha(url, siteKey, options?)`                | `FriendlyCaptchaTaskProxyless`    |
| `cutcaptcha(url, miseryKey, apiKey, options?)`           | `CutCaptchaTaskProxyless`         |
| `tencent(url, appId, options?)`                          | `TencentTaskProxyless`            |
| `atbCaptcha(url, appId, apiServer, options?)`            | `AtbCaptchaTaskProxyless`         |
| `yandexSmart(url, siteKey, options?)`                    | `YandexSmartCaptchaTaskProxyless` |
| `vkCaptcha(url, siteKey, options?)`                      | `VKCaptchaTaskProxyless`          |
| `temuCaptcha(url, options?)`                             | `TemuCaptchaTaskProxyless`        |

#### Задачи на основе изображений

| Метод                                | Тип задачи        |
| ------------------------------------ | ----------------- |
| `rotateCaptcha(body, options?)`      | `RotateTask`      |
| `coordinatesCaptcha(body, options?)` | `CoordinatesTask` |
| `gridCaptcha(body, options?)`        | `GridTask`        |
| `boundingBoxCaptcha(body, options?)` | `BoundingBoxTask` |
| `drawAroundCaptcha(body, options?)`  | `DrawAroundTask`  |

#### Произвольная задача

```ts
// Отправить любой тип задачи напрямую
await solver.solve<{ token: string }>({
  type: "SomeNewTaskType",
  websiteURL: "https://example.com",
});
```

### Поддержка прокси

Методы с поддержкой прокси принимают его через параметры options:

```ts
await solver.recaptchaV2("https://example.com", "SITE_KEY", {
  proxyType: "http",
  proxyAddress: "1.2.3.4",
  proxyPort: 8080,
  proxyLogin: "user",
  proxyPassword: "pass",
  proxy: true,
});
```

### Экспортируемые типы

```ts
import type {
  SolverOptions,
  TaskResult,
  TokenSolution,
  GRecaptchaSolution,
  ImageSolution,
  GeeTestSolution,
  GeeTestV4Solution,
  ProxyOptions,
  RecaptchaV2Options,
  HCaptchaOptions,
  TurnstileOptions,
  // ... и другие
} from "recognize";
```

### Миграция с v2

| v2 (старый)                             | v3 (текущий)                    |
| --------------------------------------- | ------------------------------- |
| `new Recognize(SOURCE.RUCAPTCHA, {})`   | `new RuCaptcha({ apiKey })`     |
| `new Recognize(SOURCE.ANTICAPTCHA, {})` | `new AntiCaptcha({ apiKey })`   |
| `{ key: "..." }`                        | `{ apiKey: "..." }`             |
| `balanse()`                             | `getBalance()`                  |
| `solvingImage(buff)`                    | `imageCaptcha(buff)`            |
| `solvingRecaptcha2()`                   | `recaptchaV2(url, key)`         |
| `solvingRecaptcha3()`                   | `recaptchaV3(url, key, action)` |
| `reportGood(id)`                        | `reportCorrect(taskId)`         |
| `reportBad(id)`                         | `reportIncorrect(taskId)`       |
| return `{ id, result }`                 | return `{ taskId, solution }`   |

### Лицензия

См. файл [LICENSE](LICENSE).
