package com.intuit.playerui.core.managed

import com.intuit.playerui.core.managed.AsyncIterationManager.State.NotStarted
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/** Wrapper of an [AsyncIterator] that captures iterations within a [StateFlow] */
public class AsyncIterationManager<Item : Any, Result : Any, Data : Any>(
    public val iterator: AsyncIterator<Item, Result, Data>,
) {
    public sealed class State {
        public object NotStarted : State()

        public object Done : State()

        public object Pending : State()

        public class Item<T : Any>(
            public val value: T,
        ) : State()

        public class Error(
            public val error: Exception,
        ) : State()
    }

    private val _state = MutableStateFlow<State>(NotStarted)

    /** a stateful flow capturing each iteration of the [iterator] and maintaining the last update */
    public val state: StateFlow<State> = _state.asStateFlow()

    /** synchronous fire-and-forget call to progress the [iterator] and update [state] */
    public fun CoroutineScope.next(result: Result? = null): Job = launch {
        result ?: _state.emit(State.NotStarted)
        _state.emit(State.Pending)
        _state.emit(
            try {
                val next = iterator.next(result)
                next?.let(State::Item) ?: State.Done
            } catch (exception: Exception) {
                State.Error(exception)
            },
        )
    }
}
