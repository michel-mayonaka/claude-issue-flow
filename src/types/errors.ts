export class AppError extends Error {
  readonly code: string;
  readonly isRetryable: boolean;
  readonly suggestion?: string;

  constructor(
    message: string,
    options: {
      code: string;
      isRetryable?: boolean;
      suggestion?: string;
      cause?: Error;
    }
  ) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = options.code;
    this.isRetryable = options.isRetryable ?? false;
    this.suggestion = options.suggestion;
  }

  toUserMessage(): string {
    let msg = `[${this.code}] ${this.message}`;
    if (this.suggestion) {
      msg += `\n  → ${this.suggestion}`;
    }
    return msg;
  }
}

export class AgentExecutionError extends AppError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, {
      code: "AGENT_EXECUTION_ERROR",
      isRetryable: false,
      suggestion:
        "エージェント実行中に問題が発生しました。ログを確認してください。",
      cause: options?.cause,
    });
  }
}

export class GitHubAPIError extends AppError {
  readonly statusCode?: number;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      isRetryable?: boolean;
      cause?: Error;
    }
  ) {
    const isRateLimit =
      options.statusCode === 403 || options.statusCode === 429;
    super(message, {
      code: isRateLimit ? "GITHUB_RATE_LIMIT" : "GITHUB_API_ERROR",
      isRetryable: options.isRetryable ?? isRateLimit,
      suggestion: isRateLimit
        ? "APIレート制限に達しました。しばらく待ってから再試行してください。"
        : "GitHub APIの呼び出しに失敗しました。トークンと権限を確認してください。",
      cause: options.cause,
    });
    this.statusCode = options.statusCode;
  }
}

export class WorktreeError extends AppError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, {
      code: "WORKTREE_ERROR",
      isRetryable: false,
      suggestion:
        "Git worktree操作に失敗しました。リポジトリの状態を確認してください。",
      cause: options?.cause,
    });
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, options?: { suggestion?: string }) {
    super(message, {
      code: "CONFIGURATION_ERROR",
      isRetryable: false,
      suggestion: options?.suggestion ?? "設定を確認してください。",
    });
  }
}

export class ParseError extends AppError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, {
      code: "PARSE_ERROR",
      isRetryable: false,
      suggestion: "入力データの形式を確認してください。",
      cause: options?.cause,
    });
  }
}
