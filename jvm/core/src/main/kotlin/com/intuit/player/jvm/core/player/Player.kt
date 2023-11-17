package com.intuit.player.jvm.core.player

import com.intuit.player.jvm.core.bridge.Completable
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.hooks.NodeSyncHook1
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.data.DataController
import com.intuit.player.jvm.core.experimental.ExperimentalPlayerApi
import com.intuit.player.jvm.core.expressions.ExpressionController
import com.intuit.player.jvm.core.flow.FlowController
import com.intuit.player.jvm.core.flow.FlowResult
import com.intuit.player.jvm.core.logger.TapableLogger
import com.intuit.player.jvm.core.player.state.*
import com.intuit.player.jvm.core.plugins.Pluggable
import com.intuit.player.jvm.core.validation.ValidationController
import com.intuit.player.jvm.core.view.View
import com.intuit.player.jvm.core.view.ViewController
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import java.net.URL

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
            internal operator fun invoke(node: Node): HooksByNode = object : HooksByNode, NodeWrapper {
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
