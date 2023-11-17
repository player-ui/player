package com.intuit.player.jvm.core.managed

import com.intuit.player.jvm.core.managed.AsyncIterationManager.State.NotStarted
import com.intuit.player.jvm.core.player.state.CompletedState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/** Wrapper of an [AsyncIterator] that captures iterations within a [StateFlow] */
public class AsyncIterationManager<Item : Any, Result : Any>(public val iterator: AsyncIterator<Item, Result>) {

    public sealed class State {
        public object NotStarted : State()
        public object Done : State()
        public object Pending : State()
        public class Item<T : Any>(public val value: T) : State()
        public class Error(public val error: Exception) : State()
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

/**
 * An [AsyncIterationManager] specifically for a [Player][com.intuit.player.jvm.core.player.Player]
 * that consumes [String] flows and a results in a [CompletedState].
 */
public typealias FlowManager = AsyncIterationManager<String, CompletedState>
