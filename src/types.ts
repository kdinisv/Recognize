export interface SolverOptions {
  apiKey: string;
  pollingInterval?: number;
  timeout?: number;
}

export interface ProxyOptions {
  proxyType: "http" | "https" | "socks4" | "socks5";
  proxyAddress: string;
  proxyPort: number;
  proxyLogin?: string;
  proxyPassword?: string;
}

export interface TaskResult<T = Record<string, string>> {
  taskId: number;
  solution: T;
}

// ── Solution types ──────────────────────────────────────────────────

export interface TokenSolution {
  token: string;
  [key: string]: unknown;
}

export interface GRecaptchaSolution {
  gRecaptchaResponse: string;
  [key: string]: unknown;
}

export interface ImageSolution {
  text: string;
  [key: string]: unknown;
}

export interface AudioSolution {
  text: string;
  [key: string]: unknown;
}

export interface GeeTestSolution {
  challenge: string;
  validate: string;
  seccode: string;
  [key: string]: unknown;
}

export interface GeeTestV4Solution {
  captcha_id: string;
  captcha_output: string;
  gen_time: string;
  lot_number: string;
  pass_token: string;
  [key: string]: unknown;
}

export interface CoordinatesSolution {
  coordinates: Array<{ x: number; y: number }>;
  [key: string]: unknown;
}

// ── Captcha options ─────────────────────────────────────────────────

export interface ImageCaptchaOptions {
  numeric?: number;
  minLen?: number;
  maxLen?: number;
  phrase?: number;
  caseSensitive?: number;
  calc?: number;
  lang?: string;
  textinstructions?: string;
}

export interface RecaptchaV2Options extends Partial<ProxyOptions> {
  proxy?: boolean;
  isInvisible?: boolean;
  recaptchaDataSValue?: string;
  userAgent?: string;
  cookies?: string;
}

export interface RecaptchaV3Options {
  isEnterprise?: boolean;
}

export interface RecaptchaV2EnterpriseOptions extends Partial<ProxyOptions> {
  proxy?: boolean;
  enterprisePayload?: Record<string, unknown>;
  apiDomain?: string;
}

export interface HCaptchaOptions extends Partial<ProxyOptions> {
  proxy?: boolean;
  isInvisible?: boolean;
  enterprisePayload?: Record<string, unknown>;
  userAgent?: string;
}

export interface FunCaptchaOptions extends Partial<ProxyOptions> {
  proxy?: boolean;
  funcaptchaApiJSSubdomain?: string;
  data?: string;
}

export interface GeeTestOptions extends Partial<ProxyOptions> {
  proxy?: boolean;
  geetestApiServerSubdomain?: string;
  geetestGetLib?: string;
}

export interface TurnstileOptions extends Partial<ProxyOptions> {
  proxy?: boolean;
  action?: string;
  cData?: string;
}

export interface DataDomeOptions extends ProxyOptions {
  [key: string]: unknown;
}

export interface CaptchaOptions {
  [key: string]: unknown;
}

// ── Internal ────────────────────────────────────────────────────────

export interface ServiceConfig {
  baseUrl: string;
  softId: number;
}

export interface ApiResponse {
  errorId: number;
  errorCode?: string;
  errorDescription?: string;
  taskId?: number;
  status?: string;
  solution?: Record<string, unknown>;
  balance?: number;
  [key: string]: unknown;
}
