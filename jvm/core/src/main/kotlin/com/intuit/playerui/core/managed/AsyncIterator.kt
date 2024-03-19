package com.intuit.playerui.core.managed

import com.intuit.playerui.core.player.state.CompletedState

/** Generic async iterator that uses some [Result] to determine the next [Item] in the iteration */
public interface AsyncIterator<Item : Any, Result : Any> {

    /**
     * [next] enables consumers to advance the iterator. The [result] of each item should be passed here to
     * give the iterator enough context to determine the next item. Passing null will restart the iterator.
     *
     * @param [result] result of the previous item used to determine next item
     * @return [Item] next item in iterator given the [result], null if the iterator is done
     * @throws Exception any exception when the iterator cannot progress
     */
    public suspend fun next(result: Result? = null): Item?

    /** [terminate] should be called when the consumer aborts before the iterator reaches the last item */
    public suspend fun terminate() {}

    /**
     * Constructors to build [AsyncIterator]s with pre-defined items. This doesn't necessarily fit into
     * the async nature of the [AsyncIterator], but is provided to easily conform pre-defined items
     * into a iterator to be consumed as an [AsyncIterator].
     */
    public companion object {
        public operator fun <Item : Any, Result : Any> invoke(vararg items: Item): AsyncIterator<Item, Result> = AsyncIterator(items.toList())

        public operator fun <Item : Any, Result : Any> invoke(items: List<Item>): AsyncIterator<Item, Result> = object : AsyncIterator<Item, Result> {
            private var index = 0

            override suspend fun next(result: Result?): Item? {
                result ?: run {
                    index = 0
                }

                return if (index < items.size) items[index++] else null
            }
        }
    }
}

/** Async iterator for multi-flow experiences */
public typealias AsyncFlowIterator = AsyncIterator<String, CompletedState>

/** Pseudo constructor for creating an [AsyncFlowIterator] from a collection of pre-defined [flows] */
public fun AsyncFlowIterator(vararg flows: String): AsyncFlowIterator = AsyncFlowIterator(flows.toList())

/** Pseudo constructor for creating an [AsyncFlowIterator] from a collection of pre-defined [flows] */
public fun AsyncFlowIterator(flows: List<String>): AsyncFlowIterator = AsyncIterator(flows)
