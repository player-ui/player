package com.intuit.player.jvm.core.player.state

import com.intuit.player.jvm.core.asset.Asset
import com.intuit.player.jvm.core.bridge.Completable
import com.intuit.player.jvm.core.bridge.EmptyNode
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.Promise
import com.intuit.player.jvm.core.bridge.deserialize
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.getSerializable
import com.intuit.player.jvm.core.bridge.getSymbol
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.data.DataController
import com.intuit.player.jvm.core.data.DataModelWithParser
import com.intuit.player.jvm.core.experimental.RuntimeClassDiscriminator
import com.intuit.player.jvm.core.expressions.ExpressionController
import com.intuit.player.jvm.core.expressions.ExpressionEvaluator
import com.intuit.player.jvm.core.flow.Flow
import com.intuit.player.jvm.core.flow.FlowController
import com.intuit.player.jvm.core.flow.FlowResult
import com.intuit.player.jvm.core.flow.Transition
import com.intuit.player.jvm.core.flow.state.NavigationFlowEndState
import com.intuit.player.jvm.core.player.Player
import com.intuit.player.jvm.core.player.PlayerException
import com.intuit.player.jvm.core.player.PlayerFlowStatus
import com.intuit.player.jvm.core.player.PlayerFlowStatus.COMPLETED
import com.intuit.player.jvm.core.player.PlayerFlowStatus.ERROR
import com.intuit.player.jvm.core.player.PlayerFlowStatus.IN_PROGRESS
import com.intuit.player.jvm.core.player.PlayerFlowStatus.NOT_STARTED
import com.intuit.player.jvm.core.player.PlayerFlowStatus.RELEASED
import com.intuit.player.jvm.core.validation.ValidationController
import com.intuit.player.jvm.core.view.View
import com.intuit.player.jvm.core.view.ViewController
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull

/** The base representation of the player state */
@Serializable
@RuntimeClassDiscriminator("status")
public sealed class PlayerFlowState : NodeWrapper {
    /** The status of the given flow */
    public abstract val status: PlayerFlowStatus

    /** A unique reference for the life-cycle of a flow */
    public val ref: String? get() = node.getSymbol("ref")
}

/** Player state describing when a flow completed successfully */
@Serializable(with = CompletedState.Serializer::class)
public class CompletedState(override val node: Node) :
    PlayerFlowExecutionState(node) {

    override val status: PlayerFlowStatus = COMPLETED

    public val endState: NavigationFlowEndState by NodeSerializableField(NavigationFlowEndState.serializer())

    public val data: JsonElement by NodeSerializableField(JsonElement.serializer()) { JsonNull }

    internal val controllers: ControllerState by NodeSerializableField(ControllerState.serializer())

    // TODO: Completed state dataModel change needs rectification here
    public val dataModel: DataModelWithParser by lazy {
        DataModelWithParser(controllers.data.node)
    }

    internal object Serializer : NodeWrapperSerializer<CompletedState>(::CompletedState, COMPLETED.value)
}

/** Player state describing when a flow finished but not successfully */
public abstract class ErrorState : PlayerFlowState() {

    override val status: PlayerFlowStatus = ERROR

    /** The currently executing flow */
    public abstract val flow: Flow

    /** The error associated with the failed flow */
    public abstract val error: PlayerException

    public companion object {

        /** Convenience method to easily construct a synthetic error message */
        public fun from(exception: PlayerException, flow: Flow = Flow()): ErrorState = object : ErrorState() {
            override val error: PlayerException = exception
            override val flow: Flow = flow
            override val node: Node = EmptyNode
        }

        /** Convenience method to easily construct a synthetic error message */
        public fun from(message: String, flow: Flow = Flow()): ErrorState = from(PlayerException(message), flow)
    }
}

@Serializable(with = ErroneousState.Serializer::class)
internal class ErroneousState(override val node: Node) :
    ErrorState(),
    NodeWrapper {

    override val flow: Flow by NodeSerializableField(Flow.serializer()) { Flow() }

    override val error: PlayerException by NodeSerializableField(PlayerException.serializer()) {
        // TODO: Need to test this error handling strategy
        when (val rawError = get(it)) {
            is PlayerException -> rawError
            is Exception -> PlayerException(rawError.message ?: "", rawError)
            is Node -> rawError.deserialize()
            is String -> PlayerException(rawError)
            else -> PlayerException(rawError?.toString() ?: "unable to determine error")
        }
    }

    internal object Serializer : NodeWrapperSerializer<ErroneousState>(::ErroneousState, ERROR.value)
}

/** [InProgressState] is for when a flow is currently executing */
@Serializable(with = InProgressState.Serializer::class)
public class InProgressState internal constructor(override val node: Node) :
    PlayerFlowExecutionState(node),
    NodeWrapper,
    ExpressionEvaluator by node.getSerializable<ControllerState>("controllers")!!.expression,
    Transition by node.getSerializable<ControllerState>("controllers")!!.flow {

    override val status: PlayerFlowStatus = IN_PROGRESS

    /** [FlowResult] value that will be available once the flow completes */
    // TODO: Make non-nullable if possible - requires Promise change
    public val flowResult: Completable<FlowResult?> get() = Promise(
        node.getObject("flowResult")!!,
    ).toCompletable(FlowResult.serializer())

    public val controllers: ControllerState by NodeSerializableField(ControllerState.serializer())

    public fun fail(error: Throwable) {
        node.getInvokable<Any>("fail")!!.invoke(error)
    }

    internal object Serializer : NodeWrapperSerializer<InProgressState>(::InProgressState, IN_PROGRESS.value)
}

// inline on purpose to capture stack trace of calling site
public inline fun InProgressState.fail(message: String): Unit = fail(PlayerException(message))

/** Fetches the currently rendered View object */
public val InProgressState.currentView: View? get() = controllers.view.currentView

/** A function to retrieve the last resolved view */
public val InProgressState.lastViewUpdate: Asset? get() = controllers.view.currentView?.lastUpdate

/** A function to get the current state of the flow state-machine */
public val InProgressState.currentFlowState: NamedState? get() = controllers.flow.current?.currentState

public val InProgressState.dataModel: DataController get() = controllers.data

@Serializable(ControllerState.Serializer::class)
public class ControllerState internal constructor(override val node: Node) : NodeWrapper {
    /** The manager for data for a flow */
    public val data: DataController by NodeSerializableField(DataController.serializer())

    /** The view manager for a flow */
    public val view: ViewController by NodeSerializableField(ViewController.serializer())

    /** The validation controller for a flow */
    public val validation: ValidationController by NodeSerializableField(ValidationController.serializer())

    /** The expression evaluator for a flow */
    public val expression: ExpressionController by NodeSerializableField(ExpressionController.serializer())

    /** the manager for the flow state machine */
    public val flow: FlowController by NodeSerializableField(FlowController.serializer())

    internal object Serializer : NodeWrapperSerializer<ControllerState>(::ControllerState)
}

/** Player state describing when the player has not yet started any flow */
@Serializable(with = NotStartedState.Serializer::class)
public class NotStartedState internal constructor(override val node: Node) :
    PlayerFlowState(),
    NodeWrapper {

    override val status: PlayerFlowStatus = NOT_STARTED

    internal object Serializer : NodeWrapperSerializer<NotStartedState>(::NotStartedState, NOT_STARTED.value)
}

/** Terminal player state the signifies when the player resources have been released */
@Serializable(with = ReleasedState.ReleasedStateSerializer::class)
public object ReleasedState : PlayerFlowState(), NodeWrapper {
    override val node: Node = EmptyNode

    override val status: PlayerFlowStatus = RELEASED

    internal object ReleasedStateSerializer : NodeWrapperSerializer<ReleasedState>({ ReleasedState }, RELEASED.value)
}

/**
 * Abstract in-execution state containing shared properties for a flow
 * (in-progress or completed successfully)
 */
public sealed class PlayerFlowExecutionState(override val node: Node) :
    PlayerFlowState(),
    NodeWrapper {

    /** The currently executing flow */
    public val flow: Flow by NodeSerializableField(Flow.serializer()) { Flow() }
}

// Set of *safe* convenience helpers for bounding state to concrete class

public val Player.notStartedState: NotStartedState? get() =
    state as? NotStartedState

public val Player.inProgressState: InProgressState? get() =
    state as? InProgressState

public val Player.completedState: CompletedState? get() =
    state as? CompletedState

public val Player.releasedState: ReleasedState? get() =
    state as? ReleasedState

public val Player.errorState: ErrorState? get() =
    state as? ErrorState
