import { Solver } from "./solver.js";
import type { SolverOptions } from "./types.js";

export class RuCaptcha extends Solver {
  constructor(options: SolverOptions) {
    super({ baseUrl: "https://api.rucaptcha.com" }, options);
  }
}
