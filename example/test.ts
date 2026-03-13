import { RuCaptcha } from "../dist/index.js";

const solver = new RuCaptcha({ apiKey: "YOUR_API_KEY" });

// ── Get balance ─────────────────────────────────────────────────────
const balance = await solver.getBalance();
console.log("Balance:", balance);

// ── Solve image captcha ─────────────────────────────────────────────
// import { readFile } from "node:fs/promises";
// const buff = await readFile("./example/captcha.png");
// const { taskId, solution } = await solver.imageCaptcha(buff);
// console.log("Image captcha:", taskId, solution.text);

// ── Solve reCAPTCHA v2 ──────────────────────────────────────────────
// const { taskId, solution } = await solver.recaptchaV2(
//   "https://example.com",
//   "6LfD3PIbAAAAAJs_eEHvoOl75_83eXSqpPSRFJ_u"
// );
// console.log("reCAPTCHA v2:", solution.gRecaptchaResponse);

// ── Solve hCaptcha ──────────────────────────────────────────────────
// const { taskId, solution } = await solver.hcaptcha(
//   "https://example.com",
//   "b76cd927-d266-4cfb-a328-3b03ae07ded6"
// );
// console.log("hCaptcha:", solution.token);

// ── Solve Turnstile ─────────────────────────────────────────────────
// const { taskId, solution } = await solver.turnstile(
//   "https://example.com",
//   "0x4AAAAAAAAkg0s3VIOD10y4"
// );
// console.log("Turnstile:", solution.token);

// ── Report ──────────────────────────────────────────────────────────
// await solver.reportCorrect(taskId);
// await solver.reportIncorrect(taskId);
