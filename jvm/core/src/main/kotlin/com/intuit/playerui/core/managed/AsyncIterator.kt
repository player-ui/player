package com.intuit.playerui.core.managed

import com.intuit.playerui.core.player.state.CompletedState
import com.intuit.playerui.core.player.state.InProgressState

/** Generic async iterator that uses some [Result] to determine the next [Item] in the iteration */
public interface AsyncIterator<Item : Any, Result : Any, Data : Any> {
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
    public suspend fun terminate(data: Data? = null) {}

    /**
     * Constructors to build [AsyncIterator]s with pre-defined items. This doesn't necessarily fit into
     * the async nature of the [AsyncIterator], but is provided to easily conform pre-defined items
     * into a iterator to be consumed as an [AsyncIterator].
     */
    public companion object {
        public operator fun <Item : Any, Result : Any, Data : Any> invoke(vararg items: Item): AsyncIterator<Item, Result, Data> =
            AsyncIterator(items.toList())

        public operator fun <Item : Any, Result : Any, Data : Any> invoke(items: List<Item>): AsyncIterator<Item, Result, Data> =
            object : AsyncIterator<Item, Result, Data> {
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
public typealias FlowManager = AsyncIterator<String, CompletedState, InProgressState>

/** Pseudo constructor for creating a [FlowManager] from a collection of pre-defined [flows] */
public fun FlowManager(vararg flows: String): FlowManager = AsyncIterator(flows.toList())

/** Pseudo constructor for creating a [FlowManager] from a collection of pre-defined [flows] */
public fun FlowManager(flows: List<String>): FlowManager = AsyncIterator(flows)
