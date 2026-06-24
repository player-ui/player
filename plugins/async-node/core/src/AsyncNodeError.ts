import {
  ErrorSeverity,
  type Node,
  type PlayerErrorMetadata,
} from "@player-ui/player";

export const ASYNC_ERROR_TYPE = "ASYNC-PLUGIN";
export type AsyncErrorMetadata = {
  node: Node.Async;
};
export class AsyncNodeError
  extends Error
  implements PlayerErrorMetadata<AsyncErrorMetadata>
{
  readonly type: string = ASYNC_ERROR_TYPE;
  readonly severity: ErrorSeverity = ErrorSeverity.ERROR;
  readonly metadata: AsyncErrorMetadata;

  constructor(
    node: Node.Async,
    message?: string,
    public readonly cause?: Error | undefined,
  ) {
    super(message);

    this.metadata = {
      node,
    };
  }
}
