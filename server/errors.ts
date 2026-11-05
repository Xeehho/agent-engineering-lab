export class LabError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'LabError';
    this.code = code;
    this.status = status;
  }
}
export function notImplemented(task: string): never {
  throw new LabError('LAB_NOT_IMPLEMENTED', '尚未完成学习任务：' + task, 501);
}

