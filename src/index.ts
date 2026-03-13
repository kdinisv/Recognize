export { RuCaptcha } from "./rucaptcha.js";
export { AntiCaptcha } from "./anticaptcha.js";
export { Solver } from "./solver.js";
export { SolverError } from "./errors.js";

export type {
  SolverOptions,
  ProxyOptions,
  TaskResult,
  TokenSolution,
  GRecaptchaSolution,
  ImageSolution,
  AudioSolution,
  GeeTestSolution,
  GeeTestV4Solution,
  CoordinatesSolution,
  ImageCaptchaOptions,
  RecaptchaV2Options,
  RecaptchaV3Options,
  RecaptchaV2EnterpriseOptions,
  HCaptchaOptions,
  FunCaptchaOptions,
  GeeTestOptions,
  TurnstileOptions,
  DataDomeOptions,
  CaptchaOptions,
} from "./types.js";

import { RuCaptcha } from "./rucaptcha.js";
import { AntiCaptcha } from "./anticaptcha.js";
import type { SolverOptions } from "./types.js";
import type { Solver } from "./solver.js";

const services = {
  rucaptcha: RuCaptcha,
  anticaptcha: AntiCaptcha,
} as const;

export type ServiceName = keyof typeof services;

export function createSolver(
  service: ServiceName,
  options: SolverOptions,
): Solver {
  const ServiceClass = services[service];
  return new ServiceClass(options);
}
