package com.intuit.playerui.core.player

import com.intuit.playerui.core.bridge.Completable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook1
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.data.DataController
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.expressions.ExpressionController
import com.intuit.playerui.core.flow.FlowController
import com.intuit.playerui.core.flow.FlowResult
import com.intuit.playerui.core.logger.TapableLogger
import com.intuit.playerui.core.player.state.CompletedState
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.core.player.state.ReleasedState
import com.intuit.playerui.core.plugins.Pluggable
import com.intuit.playerui.core.validation.ValidationController
import com.intuit.playerui.core.view.View
import com.intuit.playerui.core.view.ViewController
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.job
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import java.net.URL
import kotlin.coroutines.CoroutineContext
import kotlin.coroutines.EmptyCoroutineContext

/** Agnostic [Pluggable] [Player] to provide the core API */
public abstract class Player : Pluggable {

    public abstract val logger: TapableLogger

    /**
     * Expose [PlayerHooks] which allow consumers to plug
     * into the flow and subscribe to different events.
     */
    public abstract val hooks: Hooks

    /** [Player] hooks that expose underlying controllers for supplementing functionality */
    @Serializable(Hooks.Companion.Serializer::class)
    public interface Hooks {
        /** The hook that fires every time we create a new flowController (a new FRF) */
        public val flowController: NodeSyncHook1<FlowController>

        /** The hook that updates/handles view things */
        public val viewController: NodeSyncHook1<ViewController>

        /** A hook called every-time there's a new view. This is equivalent to the view hook on the view-controller */
        public val view: NodeSyncHook1<View>

        /** Called when an expression evaluator was created */
        public val expressionEvaluator: NodeSyncHook1<ExpressionController>

        /** The hook that creates and manages data */
        public val dataController: NodeSyncHook1<DataController>

        public val validationController: NodeSyncHook1<ValidationController>

        /** A that's called for state changes in the flow execution */
        public val state: NodeSyncHook1<out PlayerFlowState>

        public companion object {
            internal interface HooksByNode : Hooks, NodeWrapper
            public fun serializer(): KSerializer<Hooks> = Serializer
            internal operator fun invoke(node: Node): HooksByNode = object : HooksByNode {
                override val node: Node = node
                override val flowController: NodeSyncHook1<FlowController> by NodeSerializableField(NodeSyncHook1.serializer(FlowController.serializer()))
                override val viewController: NodeSyncHook1<ViewController> by NodeSerializableField(NodeSyncHook1.serializer(ViewController.serializer()))
                override val view: NodeSyncHook1<View> by NodeSerializableField(NodeSyncHook1.serializer(View.serializer()))
                override val expressionEvaluator: NodeSyncHook1<ExpressionController> by NodeSerializableField(NodeSyncHook1.serializer(ExpressionController.serializer()))
                override val dataController: NodeSyncHook1<DataController> by NodeSerializableField(NodeSyncHook1.serializer(DataController.serializer()))
                override val validationController: NodeSyncHook1<ValidationController> by NodeSerializableField(NodeSyncHook1.serializer(ValidationController.serializer()))
                override val state: NodeSyncHook1<out PlayerFlowState> by NodeSerializableField(NodeSyncHook1.serializer(PlayerFlowState.serializer()))
            }

            internal object Serializer : KSerializer<Hooks> by NodeWrapperSerializer(Hooks::invoke) as KSerializer<Hooks>
        }
    }

    /** The current [PlayerFlowState] of the player. */
    public abstract val state: PlayerFlowState

    /** [CoroutineScope] to be used for launching coroutines that should be cancelled once the Player is released */
    public abstract val scope: CoroutineScope

    /**
     * Asynchronously [start] the [flow] represented as a [String]. The
     * [FlowResult] can be obtained by subscribing the the [Completable.onComplete]
     * or by blocking on [Completable.await].
     */
    // TODO: With the ambiguity between [Completable] and [Deferred],
    //  potentially simplest solution is to make [start] suspend.
    public abstract fun start(flow: String): Completable<CompletedState>

    /**
     * Release any resources being used by the [Player] instance and
     * enter the terminal [ReleasedState]. New flows cannot be started
     * and API access is limited to [state] as other APIs will throw
     * a [PlayerException].
     *
     * If the [Player] has already been released then invoking this
     * method has no effect.
     */
    public abstract fun release()

    /**
     * Utility method to allow consumers to start a flow from a
     * [URL]. An optional [onComplete] handler can be supplied
     * to allow consumers to subscribe to the [FlowResult] in the
     * same call to [start] the flow.
     */
    @ExperimentalPlayerApi
    public fun start(flow: URL, onComplete: ((Result<CompletedState>) -> Unit)? = null): Completable<CompletedState> =
        onComplete?.let { start(flow.readText(), onComplete) } ?: start(flow.readText())

    /**
     * [ExperimentalPlayerApi] utility method to allow consumers
     * to subscribe to the [FlowResult] in the same call to [start] the flow.
     */
    @ExperimentalPlayerApi
    public fun start(flow: String, onComplete: (Result<CompletedState>) -> Unit): Completable<CompletedState> = start(flow).apply {
        onComplete(onComplete)
    }
}

/**
 * Create a child [CoroutineScope] of the [Player.scope], such that it'll inherit the [CoroutineContext],
 * but with its own [SupervisorJob]. Unless overridden by the provided [context], this ensures that the
 * sub-scope can be cancelled independently, but still contains other top-level elements, such as the
 * dispatcher or coroutine exception handler.
 */
@ExperimentalPlayerApi
public fun Player.subScope(context: CoroutineContext = EmptyCoroutineContext): CoroutineScope =
    CoroutineScope(scope.coroutineContext + SupervisorJob(scope.coroutineContext.job) + context)
