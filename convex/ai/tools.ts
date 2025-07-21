export interface MessageWriter {
  writeMessageAnnotation(annotation: { type: string; data: any }): void;
}

export interface TokenState {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  toolCost: number;
  // Allow arbitrary extensions
  [key: string]: any;
}

export interface GetToolsOpts {
  ctx: any;
  user: any;
  writer: MessageWriter;
  state: TokenState;
}
