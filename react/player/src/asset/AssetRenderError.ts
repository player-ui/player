import type { Asset } from "@player-ui/player";

export class AssetRenderError extends Error {
  private assetParentPath: Array<Asset> = [];
  initialMessage: string;
  innerExceptionMessage: string;

  constructor(
    readonly rootAsset: Asset,
    message?: string,
    readonly innerException?: unknown,
  ) {
    super(message);
    this.initialMessage = message ?? "";
    this.innerExceptionMessage =
      innerException instanceof Error
        ? innerException.message
        : String(innerException);

    if (this.innerExceptionMessage) {
      this.initialMessage = this.initialMessage.concat(
        "\nCaused by: ",
        this.innerExceptionMessage,
      );
    }

    this.message = this.initialMessage;
  }

  private updateMessage() {
    this.message = `${this.initialMessage}
${this.getAssetPathMessage()}
`;
  }

  getAssetPathMessage() {
    return `Exception occurred in asset with id '${this.rootAsset.id}' of type '${this.rootAsset.type}'${this.assetParentPath.map((c) => `\n\tFound in (id: '${c.id}', type: '${c.type}')`)}`;
  }

  addAssetParent(asset: Asset): void {
    this.assetParentPath.push(asset);
    this.updateMessage();
  }
}
