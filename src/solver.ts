import { setTimeout } from "node:timers/promises";
import { SolverError } from "./errors.js";
import type {
  ApiResponse,
  CaptchaOptions,
  DataDomeOptions,
  FunCaptchaOptions,
  GeeTestOptions,
  GeeTestSolution,
  GeeTestV4Solution,
  GRecaptchaSolution,
  HCaptchaOptions,
  ImageCaptchaOptions,
  ImageSolution,
  RecaptchaV2EnterpriseOptions,
  RecaptchaV2Options,
  RecaptchaV3Options,
  ServiceConfig,
  SolverOptions,
  TaskResult,
  TokenSolution,
  TurnstileOptions,
} from "./types.js";

export abstract class Solver {
  private readonly _baseUrl: string;
  private readonly _clientKey: string;
  private readonly _softId: number;
  private readonly _pollingInterval: number;
  private readonly _timeout: number;

  protected constructor(config: ServiceConfig, options: SolverOptions) {
    if (!options.apiKey) throw new Error("apiKey is required");
    this._baseUrl = config.baseUrl;
    this._clientKey = options.apiKey;
    this._softId = config.softId;
    this._pollingInterval = options.pollingInterval ?? 5000;
    this._timeout = options.timeout ?? 180_000;
  }

  // ── Internal helpers ──────────────────────────────────────────────

  private async _post(
    method: string,
    body: Record<string, unknown>,
  ): Promise<ApiResponse> {
    const res = await fetch(`${this._baseUrl}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as ApiResponse;
    if (data.errorId && data.errorId !== 0) {
      throw new SolverError(
        data.errorId,
        data.errorCode ?? "",
        data.errorDescription,
      );
    }
    return data;
  }

  private async _createTask(task: Record<string, unknown>): Promise<number> {
    const data = await this._post("createTask", {
      clientKey: this._clientKey,
      task,
      softId: this._softId,
    });
    return data.taskId!;
  }

  private async _getTaskResult<T>(taskId: number): Promise<T> {
    const deadline = Date.now() + this._timeout;
    while (Date.now() < deadline) {
      await setTimeout(this._pollingInterval);
      const data = await this._post("getTaskResult", {
        clientKey: this._clientKey,
        taskId,
      });
      if (data.status === "ready") return data.solution as T;
    }
    throw new Error("Timeout waiting for task result");
  }

  private async _solve<T>(
    task: Record<string, unknown>,
  ): Promise<TaskResult<T>> {
    const taskId = await this._createTask(task);
    const solution = await this._getTaskResult<T>(taskId);
    return { taskId, solution };
  }

  // ── Account ───────────────────────────────────────────────────────

  async getBalance(): Promise<number> {
    const data = await this._post("getBalance", { clientKey: this._clientKey });
    return data.balance!;
  }

  async reportCorrect(taskId: number): Promise<boolean> {
    await this._post("reportCorrect", { clientKey: this._clientKey, taskId });
    return true;
  }

  async reportIncorrect(taskId: number): Promise<boolean> {
    await this._post("reportIncorrect", { clientKey: this._clientKey, taskId });
    return true;
  }

  // ── Image / Text captchas ────────────────────────────────────────

  async imageCaptcha(
    body: Buffer | string,
    options: ImageCaptchaOptions = {},
  ): Promise<TaskResult<ImageSolution>> {
    return this._solve<ImageSolution>({
      type: "ImageToTextTask",
      body: Buffer.isBuffer(body) ? body.toString("base64") : body,
      ...options,
    });
  }

  async textCaptcha(
    textcaptcha: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<ImageSolution>> {
    return this._solve<ImageSolution>({
      type: "TextCaptchaTask",
      ...options,
      textcaptcha,
    });
  }

  async audioCaptcha(
    body: Buffer | string,
    lang = "en",
  ): Promise<TaskResult<ImageSolution>> {
    return this._solve<ImageSolution>({
      type: "AudioTask",
      body: Buffer.isBuffer(body) ? body.toString("base64") : body,
      lang,
    });
  }

  // ── reCAPTCHA ─────────────────────────────────────────────────────

  async recaptchaV2(
    websiteURL: string,
    websiteKey: string,
    options: RecaptchaV2Options = {},
  ): Promise<TaskResult<GRecaptchaSolution>> {
    const { proxy, ...rest } = options;
    return this._solve<GRecaptchaSolution>({
      type: proxy ? "RecaptchaV2Task" : "RecaptchaV2TaskProxyless",
      websiteURL,
      websiteKey,
      ...rest,
    });
  }

  async recaptchaV3(
    websiteURL: string,
    websiteKey: string,
    pageAction: string,
    minScore = 0.3,
    options: RecaptchaV3Options = {},
  ): Promise<TaskResult<GRecaptchaSolution>> {
    return this._solve<GRecaptchaSolution>({
      type: "RecaptchaV3TaskProxyless",
      websiteURL,
      websiteKey,
      pageAction,
      minScore,
      ...options,
    });
  }

  async recaptchaV2Enterprise(
    websiteURL: string,
    websiteKey: string,
    options: RecaptchaV2EnterpriseOptions = {},
  ): Promise<TaskResult<GRecaptchaSolution>> {
    const { proxy, ...rest } = options;
    return this._solve<GRecaptchaSolution>({
      type: proxy
        ? "RecaptchaV2EnterpriseTask"
        : "RecaptchaV2EnterpriseTaskProxyless",
      websiteURL,
      websiteKey,
      ...rest,
    });
  }

  // ── hCaptcha ──────────────────────────────────────────────────────

  async hcaptcha(
    websiteURL: string,
    websiteKey: string,
    options: HCaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    const { proxy, ...rest } = options;
    return this._solve<TokenSolution>({
      type: proxy ? "HCaptchaTask" : "HCaptchaTaskProxyless",
      websiteURL,
      websiteKey,
      ...rest,
    });
  }

  // ── FunCaptcha (Arkose Labs) ──────────────────────────────────────

  async funcaptcha(
    websiteURL: string,
    websitePublicKey: string,
    options: FunCaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    const { proxy, ...rest } = options;
    return this._solve<TokenSolution>({
      type: proxy ? "FunCaptchaTask" : "FunCaptchaTaskProxyless",
      websiteURL,
      websitePublicKey,
      ...rest,
    });
  }

  // ── GeeTest ───────────────────────────────────────────────────────

  async geetest(
    websiteURL: string,
    gt: string,
    challenge: string,
    options: GeeTestOptions = {},
  ): Promise<TaskResult<GeeTestSolution>> {
    const { proxy, ...rest } = options;
    return this._solve<GeeTestSolution>({
      type: proxy ? "GeeTestTask" : "GeeTestTaskProxyless",
      websiteURL,
      gt,
      challenge,
      ...rest,
    });
  }

  async geetestV4(
    websiteURL: string,
    captchaId: string,
    options: GeeTestOptions = {},
  ): Promise<TaskResult<GeeTestV4Solution>> {
    const { proxy, ...rest } = options;
    return this._solve<GeeTestV4Solution>({
      type: proxy ? "GeeTestTask" : "GeeTestTaskProxyless",
      websiteURL,
      captchaId,
      version: 4,
      ...rest,
    });
  }

  // ── Cloudflare Turnstile ──────────────────────────────────────────

  async turnstile(
    websiteURL: string,
    websiteKey: string,
    options: TurnstileOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    const { proxy, ...rest } = options;
    return this._solve<TokenSolution>({
      type: proxy ? "TurnstileTask" : "TurnstileTaskProxyless",
      websiteURL,
      websiteKey,
      ...rest,
    });
  }

  // ── Amazon WAF ────────────────────────────────────────────────────

  async amazonWaf(
    websiteURL: string,
    websiteKey: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "AmazonTaskProxyless",
      websiteURL,
      websiteKey,
      ...options,
    });
  }

  // ── KeyCaptcha ────────────────────────────────────────────────────

  async keyCaptcha(
    websiteURL: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "KeyCaptchaTaskProxyless",
      websiteURL,
      ...options,
    });
  }

  // ── Lemin ─────────────────────────────────────────────────────────

  async lemin(
    websiteURL: string,
    captchaId: string,
    apiServer: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "LeminTaskProxyless",
      websiteURL,
      captchaId,
      apiServer,
      ...options,
    });
  }

  // ── Capy Puzzle ───────────────────────────────────────────────────

  async capyPuzzle(
    websiteURL: string,
    websiteKey: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "CapyTaskProxyless",
      websiteURL,
      websiteKey,
      ...options,
    });
  }

  // ── DataDome ──────────────────────────────────────────────────────

  async dataDome(
    websiteURL: string,
    captchaUrl: string,
    userAgent: string,
    proxyConfig: DataDomeOptions,
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "DataDomeSliderTask",
      websiteURL,
      captchaUrl,
      userAgent,
      ...proxyConfig,
    });
  }

  // ── CyberSiARA ───────────────────────────────────────────────────

  async cyberSiara(
    websiteURL: string,
    slideMasterUrlId: string,
    userAgent: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "AntiCyberSiAraTaskProxyless",
      websiteURL,
      SlideMasterUrlId: slideMasterUrlId,
      userAgent,
      ...options,
    });
  }

  // ── MTCaptcha ─────────────────────────────────────────────────────

  async mtCaptcha(
    websiteURL: string,
    websiteKey: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "MtCaptchaTaskProxyless",
      websiteURL,
      websiteKey,
      ...options,
    });
  }

  // ── Friendly Captcha ─────────────────────────────────────────────

  async friendlyCaptcha(
    websiteURL: string,
    websiteKey: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "FriendlyCaptchaTaskProxyless",
      websiteURL,
      websiteKey,
      ...options,
    });
  }

  // ── Cutcaptcha ────────────────────────────────────────────────────

  async cutcaptcha(
    websiteURL: string,
    miseryKey: string,
    apiKey: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "CutCaptchaTaskProxyless",
      websiteURL,
      miseryKey,
      apiKey,
      ...options,
    });
  }

  // ── Tencent ───────────────────────────────────────────────────────

  async tencent(
    websiteURL: string,
    appId: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "TencentTaskProxyless",
      websiteURL,
      appId,
      ...options,
    });
  }

  // ── atbCAPTCHA ────────────────────────────────────────────────────

  async atbCaptcha(
    websiteURL: string,
    appId: string,
    apiServer: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "AtbCaptchaTaskProxyless",
      websiteURL,
      appId,
      apiServer,
      ...options,
    });
  }

  // ── Rotate ────────────────────────────────────────────────────────

  async rotateCaptcha(
    body: Buffer | string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "RotateTask",
      body: Buffer.isBuffer(body) ? body.toString("base64") : body,
      ...options,
    });
  }

  // ── Coordinates (click) ───────────────────────────────────────────

  async coordinatesCaptcha(
    body: Buffer | string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult> {
    return this._solve({
      type: "CoordinatesTask",
      body: Buffer.isBuffer(body) ? body.toString("base64") : body,
      ...options,
    });
  }

  // ── Grid ──────────────────────────────────────────────────────────

  async gridCaptcha(
    body: Buffer | string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult> {
    return this._solve({
      type: "GridTask",
      body: Buffer.isBuffer(body) ? body.toString("base64") : body,
      ...options,
    });
  }

  // ── Bounding Box ──────────────────────────────────────────────────

  async boundingBoxCaptcha(
    body: Buffer | string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult> {
    return this._solve({
      type: "BoundingBoxTask",
      body: Buffer.isBuffer(body) ? body.toString("base64") : body,
      ...options,
    });
  }

  // ── Draw Around (Canvas) ──────────────────────────────────────────

  async drawAroundCaptcha(
    body: Buffer | string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult> {
    return this._solve({
      type: "DrawAroundTask",
      body: Buffer.isBuffer(body) ? body.toString("base64") : body,
      ...options,
    });
  }

  // ── Yandex Smart Captcha ─────────────────────────────────────────

  async yandexSmart(
    websiteURL: string,
    websiteKey: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "YandexSmartCaptchaTaskProxyless",
      websiteURL,
      websiteKey,
      ...options,
    });
  }

  // ── VK Captcha ────────────────────────────────────────────────────

  async vkCaptcha(
    websiteURL: string,
    websiteKey: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "VKCaptchaTaskProxyless",
      websiteURL,
      websiteKey,
      ...options,
    });
  }

  // ── Temu Captcha ──────────────────────────────────────────────────

  async temuCaptcha(
    websiteURL: string,
    options: CaptchaOptions = {},
  ): Promise<TaskResult<TokenSolution>> {
    return this._solve<TokenSolution>({
      type: "TemuCaptchaTaskProxyless",
      websiteURL,
      ...options,
    });
  }

  // ── Generic / Custom task ─────────────────────────────────────────

  async solve<T = Record<string, string>>(
    task: Record<string, unknown>,
  ): Promise<TaskResult<T>> {
    return this._solve<T>(task);
  }
}
