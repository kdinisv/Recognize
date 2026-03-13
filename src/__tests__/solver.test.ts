import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RuCaptcha } from "../rucaptcha.js";
import { AntiCaptcha } from "../anticaptcha.js";
import { SolverError } from "../errors.js";
import { createSolver } from "../index.js";

// ── Helpers ─────────────────────────────────────────────────────────

function mockFetch(responses: Array<Record<string, unknown>>) {
  const queue = [...responses];
  return vi.fn(async () => ({
    json: async () => queue.shift()!,
  })) as unknown as typeof global.fetch;
}

function readyResponse(solution: Record<string, unknown> = { token: "abc" }) {
  return { errorId: 0, status: "ready", solution };
}

function taskCreatedResponse(taskId = 12345) {
  return { errorId: 0, taskId };
}

function processingResponse() {
  return { errorId: 0, status: "processing" };
}

// ── Constructor ─────────────────────────────────────────────────────

describe("Constructor", () => {
  it("throws if apiKey is empty", () => {
    expect(() => new RuCaptcha({ apiKey: "" })).toThrow("apiKey is required");
  });

  it("creates RuCaptcha instance", () => {
    const solver = new RuCaptcha({ apiKey: "test-key" });
    expect(solver).toBeInstanceOf(RuCaptcha);
  });

  it("creates AntiCaptcha instance", () => {
    const solver = new AntiCaptcha({ apiKey: "test-key" });
    expect(solver).toBeInstanceOf(AntiCaptcha);
  });
});

// ── createSolver factory ────────────────────────────────────────────

describe("createSolver", () => {
  it("creates RuCaptcha via factory", () => {
    const solver = createSolver("rucaptcha", { apiKey: "key" });
    expect(solver).toBeInstanceOf(RuCaptcha);
  });

  it("creates AntiCaptcha via factory", () => {
    const solver = createSolver("anticaptcha", { apiKey: "key" });
    expect(solver).toBeInstanceOf(AntiCaptcha);
  });
});

// ── SolverError ─────────────────────────────────────────────────────

describe("SolverError", () => {
  it("sets properties correctly", () => {
    const err = new SolverError(1, "ERROR_KEY", "Some description");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("SolverError");
    expect(err.errorId).toBe(1);
    expect(err.errorCode).toBe("ERROR_KEY");
    expect(err.errorDescription).toBe("Some description");
    expect(err.message).toBe("ERROR_KEY");
  });

  it("builds message from errorId when errorCode is empty", () => {
    const err = new SolverError(42, "", "desc");
    expect(err.message).toBe("Error 42: desc");
  });

  it("handles missing description", () => {
    const err = new SolverError(1, "CODE");
    expect(err.errorDescription).toBe("");
  });
});

// ── API methods ─────────────────────────────────────────────────────

describe("Solver API", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ── getBalance ──────────────────────────────────────────────────

  describe("getBalance", () => {
    it("returns balance value", async () => {
      global.fetch = mockFetch([{ errorId: 0, balance: 42.5 }]);
      const solver = new RuCaptcha({ apiKey: "key" });

      const balance = await solver.getBalance();

      expect(balance).toBe(42.5);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.rucaptcha.com/getBalance",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ clientKey: "key" }),
        }),
      );
    });

    it("uses Anti-Captcha base URL", async () => {
      global.fetch = mockFetch([{ errorId: 0, balance: 10 }]);
      const solver = new AntiCaptcha({ apiKey: "key" });

      await solver.getBalance();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.anti-captcha.com/getBalance",
        expect.any(Object),
      );
    });
  });

  // ── reportCorrect / reportIncorrect ─────────────────────────────

  describe("report methods", () => {
    it("reportCorrect sends taskId", async () => {
      global.fetch = mockFetch([{ errorId: 0 }]);
      const solver = new RuCaptcha({ apiKey: "key" });

      const result = await solver.reportCorrect(123);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.rucaptcha.com/reportCorrect",
        expect.objectContaining({
          body: JSON.stringify({ clientKey: "key", taskId: 123 }),
        }),
      );
    });

    it("reportIncorrect sends taskId", async () => {
      global.fetch = mockFetch([{ errorId: 0 }]);
      const solver = new RuCaptcha({ apiKey: "key" });

      const result = await solver.reportIncorrect(456);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.rucaptcha.com/reportIncorrect",
        expect.objectContaining({
          body: JSON.stringify({ clientKey: "key", taskId: 456 }),
        }),
      );
    });
  });

  // ── Error handling ──────────────────────────────────────────────

  describe("error handling", () => {
    it("throws SolverError on API error", async () => {
      global.fetch = mockFetch([
        {
          errorId: 1,
          errorCode: "ERROR_WRONG_USER_KEY",
          errorDescription: "Bad key",
        },
      ]);
      const solver = new RuCaptcha({ apiKey: "bad-key" });

      await expect(solver.getBalance()).rejects.toThrow(SolverError);
      await expect(
        solver.getBalance().catch((e) => {
          expect((e as SolverError).errorCode).toBe("ERROR_WRONG_USER_KEY");
          throw e;
        }),
      ).rejects.toThrow();
    });

    it("throws on timeout", async () => {
      // Processing forever → timeout
      global.fetch = mockFetch(
        Array.from({ length: 100 }, () => processingResponse()),
      );
      const solver = new RuCaptcha({
        apiKey: "key",
        pollingInterval: 10,
        timeout: 50,
      });

      await expect(solver.imageCaptcha("base64data")).rejects.toThrow(
        "Timeout",
      );
    });
  });

  // ── imageCaptcha ────────────────────────────────────────────────

  describe("imageCaptcha", () => {
    it("sends ImageToTextTask with base64 string", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ text: "abc123" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      const result = await solver.imageCaptcha("base64body");

      expect(result).toEqual({
        taskId: 12345,
        solution: { text: "abc123" },
      });

      const createCall = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(createCall.task.type).toBe("ImageToTextTask");
      expect(createCall.task.body).toBe("base64body");
      expect(createCall.softId).toBe(768);
    });

    it("converts Buffer to base64", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ text: "xyz" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.imageCaptcha(Buffer.from("hello"));

      const createCall = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(createCall.task.body).toBe(
        Buffer.from("hello").toString("base64"),
      );
    });

    it("passes extra options", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ text: "test" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.imageCaptcha("body", { numeric: 1, minLen: 4, maxLen: 6 });

      const createCall = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(createCall.task.numeric).toBe(1);
      expect(createCall.task.minLen).toBe(4);
      expect(createCall.task.maxLen).toBe(6);
    });
  });

  // ── textCaptcha ─────────────────────────────────────────────────

  describe("textCaptcha", () => {
    it("sends TextCaptchaTask", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ text: "blue" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      const result = await solver.textCaptcha("What color is the sky?");

      expect(result.solution.text).toBe("blue");
      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("TextCaptchaTask");
      expect(task.textcaptcha).toBe("What color is the sky?");
    });
  });

  // ── recaptchaV2 ─────────────────────────────────────────────────

  describe("recaptchaV2", () => {
    it("sends RecaptchaV2TaskProxyless by default", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ gRecaptchaResponse: "token123" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      const result = await solver.recaptchaV2(
        "https://example.com",
        "site-key",
      );

      expect(result.solution.gRecaptchaResponse).toBe("token123");
      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("RecaptchaV2TaskProxyless");
      expect(task.websiteURL).toBe("https://example.com");
      expect(task.websiteKey).toBe("site-key");
    });

    it("uses RecaptchaV2Task with proxy", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ gRecaptchaResponse: "t" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.recaptchaV2("https://example.com", "key", {
        proxy: true,
        proxyType: "http",
        proxyAddress: "1.2.3.4",
        proxyPort: 8080,
      });

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("RecaptchaV2Task");
      expect(task.proxyType).toBe("http");
      expect(task.proxyAddress).toBe("1.2.3.4");
      expect(task.proxyPort).toBe(8080);
      // proxy flag should not leak into task
      expect(task.proxy).toBeUndefined();
    });
  });

  // ── recaptchaV3 ─────────────────────────────────────────────────

  describe("recaptchaV3", () => {
    it("sends RecaptchaV3TaskProxyless", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ gRecaptchaResponse: "v3token" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.recaptchaV3("https://ex.com", "sitekey", "login", 0.9);

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("RecaptchaV3TaskProxyless");
      expect(task.pageAction).toBe("login");
      expect(task.minScore).toBe(0.9);
    });
  });

  // ── recaptchaV2Enterprise ───────────────────────────────────────

  describe("recaptchaV2Enterprise", () => {
    it("sends RecaptchaV2EnterpriseTaskProxyless", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ gRecaptchaResponse: "ent" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.recaptchaV2Enterprise("https://ex.com", "sitekey");

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("RecaptchaV2EnterpriseTaskProxyless");
    });

    it("uses RecaptchaV2EnterpriseTask with proxy", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ gRecaptchaResponse: "ent" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.recaptchaV2Enterprise("https://ex.com", "sitekey", {
        proxy: true,
        proxyType: "socks5",
        proxyAddress: "5.6.7.8",
        proxyPort: 1080,
      });

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("RecaptchaV2EnterpriseTask");
    });
  });

  // ── hCaptcha ────────────────────────────────────────────────────

  describe("hcaptcha", () => {
    it("sends HCaptchaTaskProxyless", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ token: "htoken" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      const result = await solver.hcaptcha("https://ex.com", "sitekey");

      expect(result.solution.token).toBe("htoken");
      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("HCaptchaTaskProxyless");
    });

    it("uses HCaptchaTask with proxy", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ token: "t" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.hcaptcha("https://ex.com", "key", {
        proxy: true,
        proxyType: "http",
        proxyAddress: "1.1.1.1",
        proxyPort: 3128,
      });

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("HCaptchaTask");
    });
  });

  // ── FunCaptcha ──────────────────────────────────────────────────

  describe("funcaptcha", () => {
    it("sends FunCaptchaTaskProxyless", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ token: "fun" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.funcaptcha("https://ex.com", "pubkey");

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("FunCaptchaTaskProxyless");
      expect(task.websitePublicKey).toBe("pubkey");
    });

    it("uses FunCaptchaTask with proxy", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ token: "fun" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.funcaptcha("https://ex.com", "pubkey", {
        proxy: true,
        proxyType: "http",
        proxyAddress: "1.2.3.4",
        proxyPort: 8080,
      });

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("FunCaptchaTask");
    });
  });

  // ── GeeTest ─────────────────────────────────────────────────────

  describe("geetest", () => {
    it("sends GeeTestTaskProxyless", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({
          challenge: "c",
          validate: "v",
          seccode: "s",
        }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      const result = await solver.geetest("https://ex.com", "gt123", "ch456");

      expect(result.solution.challenge).toBe("c");
      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("GeeTestTaskProxyless");
      expect(task.gt).toBe("gt123");
      expect(task.challenge).toBe("ch456");
    });
  });

  describe("geetestV4", () => {
    it("sends GeeTestTaskProxyless with version 4", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({
          captcha_id: "id",
          captcha_output: "out",
          gen_time: "t",
          lot_number: "n",
          pass_token: "p",
        }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.geetestV4("https://ex.com", "captchaId");

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("GeeTestTaskProxyless");
      expect(task.captchaId).toBe("captchaId");
      expect(task.version).toBe(4);
    });
  });

  // ── Turnstile ───────────────────────────────────────────────────

  describe("turnstile", () => {
    it("sends TurnstileTaskProxyless", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ token: "cf" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.turnstile("https://ex.com", "sitekey");

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("TurnstileTaskProxyless");
    });

    it("uses TurnstileTask with proxy", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ token: "cf" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.turnstile("https://ex.com", "sitekey", {
        proxy: true,
        proxyType: "http",
        proxyAddress: "1.2.3.4",
        proxyPort: 80,
      });

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("TurnstileTask");
    });
  });

  // ── Amazon WAF ──────────────────────────────────────────────────

  describe("amazonWaf", () => {
    it("sends AmazonTaskProxyless", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ token: "aws" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.amazonWaf("https://ex.com", "awskey");

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("AmazonTaskProxyless");
    });
  });

  // ── Yandex Smart Captcha ────────────────────────────────────────

  describe("yandexSmart", () => {
    it("sends YandexSmartCaptchaTaskProxyless", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ token: "ya" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.yandexSmart("https://ex.com", "yakey");

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("YandexSmartCaptchaTaskProxyless");
      expect(task.websiteKey).toBe("yakey");
    });
  });

  // ── VK Captcha ──────────────────────────────────────────────────

  describe("vkCaptcha", () => {
    it("sends VKCaptchaTaskProxyless", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ token: "vk" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.vkCaptcha("https://ex.com", "vkkey");

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("VKCaptchaTaskProxyless");
    });
  });

  // ── DataDome ────────────────────────────────────────────────────

  describe("dataDome", () => {
    it("sends DataDomeSliderTask with proxy config", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ token: "dd" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.dataDome("https://ex.com", "https://cap.url", "ua-string", {
        proxyType: "http",
        proxyAddress: "1.2.3.4",
        proxyPort: 8080,
      });

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("DataDomeSliderTask");
      expect(task.captchaUrl).toBe("https://cap.url");
      expect(task.userAgent).toBe("ua-string");
      expect(task.proxyType).toBe("http");
    });
  });

  // ── Other captcha types ─────────────────────────────────────────

  describe("other captcha types", () => {
    const taskTypes: Array<{
      method: string;
      args: unknown[];
      expectedType: string;
    }> = [
      {
        method: "keyCaptcha",
        args: ["https://ex.com"],
        expectedType: "KeyCaptchaTaskProxyless",
      },
      {
        method: "lemin",
        args: ["https://ex.com", "capId", "https://api.server"],
        expectedType: "LeminTaskProxyless",
      },
      {
        method: "capyPuzzle",
        args: ["https://ex.com", "capykey"],
        expectedType: "CapyTaskProxyless",
      },
      {
        method: "cyberSiara",
        args: ["https://ex.com", "slideId", "user-agent"],
        expectedType: "AntiCyberSiAraTaskProxyless",
      },
      {
        method: "mtCaptcha",
        args: ["https://ex.com", "mtkey"],
        expectedType: "MtCaptchaTaskProxyless",
      },
      {
        method: "friendlyCaptcha",
        args: ["https://ex.com", "fckey"],
        expectedType: "FriendlyCaptchaTaskProxyless",
      },
      {
        method: "cutcaptcha",
        args: ["https://ex.com", "misKey", "apiKey"],
        expectedType: "CutCaptchaTaskProxyless",
      },
      {
        method: "tencent",
        args: ["https://ex.com", "appId"],
        expectedType: "TencentTaskProxyless",
      },
      {
        method: "atbCaptcha",
        args: ["https://ex.com", "appId", "https://api.server"],
        expectedType: "AtbCaptchaTaskProxyless",
      },
      {
        method: "temuCaptcha",
        args: ["https://ex.com"],
        expectedType: "TemuCaptchaTaskProxyless",
      },
    ];

    for (const { method, args, expectedType } of taskTypes) {
      it(`${method} sends ${expectedType}`, async () => {
        global.fetch = mockFetch([
          taskCreatedResponse(),
          readyResponse({ token: "ok" }),
        ]);
        const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

        await (solver as any)[method](...args);

        const task = JSON.parse(
          (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
        ).task;
        expect(task.type).toBe(expectedType);
      });
    }
  });

  // ── Image-based captchas ────────────────────────────────────────

  describe("image-based captcha types", () => {
    const imageTypes: Array<{ method: string; expectedType: string }> = [
      { method: "rotateCaptcha", expectedType: "RotateTask" },
      { method: "coordinatesCaptcha", expectedType: "CoordinatesTask" },
      { method: "gridCaptcha", expectedType: "GridTask" },
      { method: "boundingBoxCaptcha", expectedType: "BoundingBoxTask" },
      { method: "drawAroundCaptcha", expectedType: "DrawAroundTask" },
    ];

    for (const { method, expectedType } of imageTypes) {
      it(`${method} sends ${expectedType}`, async () => {
        global.fetch = mockFetch([
          taskCreatedResponse(),
          readyResponse({ token: "ok" }),
        ]);
        const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

        await (solver as any)[method]("base64image");

        const task = JSON.parse(
          (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
        ).task;
        expect(task.type).toBe(expectedType);
        expect(task.body).toBe("base64image");
      });
    }
  });

  // ── audioCaptcha ────────────────────────────────────────────────

  describe("audioCaptcha", () => {
    it("sends AudioTask with lang", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ text: "audio" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.audioCaptcha("audiodata", "ru");

      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("AudioTask");
      expect(task.lang).toBe("ru");
    });
  });

  // ── Generic solve ───────────────────────────────────────────────

  describe("solve (generic)", () => {
    it("sends arbitrary task", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ custom: "value" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      const result = await solver.solve({
        type: "CustomTask",
        foo: "bar",
      });

      expect(result.solution).toEqual({ custom: "value" });
      const task = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      ).task;
      expect(task.type).toBe("CustomTask");
      expect(task.foo).toBe("bar");
    });
  });

  // ── Polling behavior ───────────────────────────────────────────

  describe("polling", () => {
    it("retries until ready", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        processingResponse(),
        processingResponse(),
        readyResponse({ text: "done" }),
      ]);
      const solver = new RuCaptcha({
        apiKey: "key",
        pollingInterval: 10,
        timeout: 5000,
      });

      const result = await solver.imageCaptcha("body");

      expect(result.solution.text).toBe("done");
      // 1 createTask + 3 getTaskResult = 4 calls
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });

  // ── Anti-Captcha softId ─────────────────────────────────────────

  describe("softId", () => {
    it("RuCaptcha sends softId 768", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ text: "x" }),
      ]);
      const solver = new RuCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.imageCaptcha("body");

      const body = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(body.softId).toBe(768);
    });

    it("AntiCaptcha sends softId 720", async () => {
      global.fetch = mockFetch([
        taskCreatedResponse(),
        readyResponse({ text: "x" }),
      ]);
      const solver = new AntiCaptcha({ apiKey: "key", pollingInterval: 10 });

      await solver.imageCaptcha("body");

      const body = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(body.softId).toBe(720);
    });
  });
});
