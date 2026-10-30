import type { StreamingDataLoadContext, StreamingDataPage } from "./types";

/**
 * The contract between the StreamingDataPlugin and a team's backend.
 *
 * Implement this (or the page-oriented `PagedStreamingDataLoader` below) to
 * fetch large data sets into Player without writing them to the data model.
 * The plugin consumes the pages as they're yielded, tracks pagination status,
 * and exposes the accumulated records at the configured binding.
 */
export abstract class StreamingDataLoader<TRecord = unknown> {
  /**
   * Start loading data.
   * Yield a page as each chunk of records becomes available.
   * Returning ends the stream and marks the data as completed.
   * Throwing surfaces the error on the source's status binding.
   */
  public abstract load(
    context: StreamingDataLoadContext,
  ): AsyncIterable<StreamingDataPage<TRecord>>;
}

/** The result of fetching a single page from a paged backend */
export interface PagedDataResult<TRecord = unknown>
  extends StreamingDataPage<TRecord> {
  /**
   * Whether more pages remain after this one.
   * When omitted, `totalPages` is used if present.
   * When neither is provided, loading continues until a page comes back empty.
   */
  hasMore?: boolean;
}

/**
 * A convenience base class for backends with index-based pagination.
 * Implement `fetchPage` to request a single page. Pages are requested
 * sequentially starting at index 0 until the result reports no more pages.
 */
export abstract class PagedStreamingDataLoader<
  TRecord = unknown,
> extends StreamingDataLoader<TRecord> {
  /** Fetch one page of records from the backend */
  protected abstract fetchPage(
    pageIndex: number,
    signal: AbortSignal,
  ): Promise<PagedDataResult<TRecord>>;

  public async *load(
    context: StreamingDataLoadContext,
  ): AsyncIterable<StreamingDataPage<TRecord>> {
    let pageIndex = 0;

    while (!context.signal.aborted) {
      const result = await this.fetchPage(pageIndex, context.signal);
      yield result;
      pageIndex += 1;

      const hasMore =
        result.hasMore ??
        (result.totalPages !== undefined
          ? pageIndex < result.totalPages
          : result.records.length > 0);

      if (!hasMore) {
        return;
      }
    }
  }
}
