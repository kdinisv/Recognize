export class SolverError extends Error {
  readonly errorId: number;
  readonly errorCode: string;
  readonly errorDescription: string;

  constructor(errorId: number, errorCode: string, errorDescription?: string) {
    super(errorCode || `Error ${errorId}: ${errorDescription ?? "unknown"}`);
    this.name = "SolverError";
    this.errorId = errorId;
    this.errorCode = errorCode;
    this.errorDescription = errorDescription ?? "";
  }
}
