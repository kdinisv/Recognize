import { Solver } from "./solver.js";
import type { SolverOptions } from "./types.js";

export class AntiCaptcha extends Solver {
  constructor(options: SolverOptions) {
    super({ baseUrl: "https://api.anti-captcha.com" }, options);
  }
}
