package com.intuit.player.jvm.core.flow.state

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.experimental.RuntimeClassDiscriminator
import com.intuit.player.jvm.core.expressions.Expression
import com.intuit.player.jvm.core.flow.state.NavigationFlowStateType.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer

/** The base representation of a state within a Flow */
@Serializable
@RuntimeClassDiscriminator("state_type")
public sealed class NavigationFlowState : NodeWrapper {
    /** A property to determine the type of state this is */
    public abstract val stateType: NavigationFlowStateType
}

/** A generic state that can transition to another state */
@Serializable
public sealed class NavigationFlowTransitionableState(override val node: Node) : NavigationFlowState() {
    /** A mapping of transition-name to FlowState name */
    public val transitions: Map<String, String> by NodeSerializableField(MapSerializer(String.serializer(), String.serializer()))

    /** An id corresponding to a view from the 'views' array */
    public val ref: String by NodeSerializableField(String.serializer())
}

/** Action states execute an expression to determine the next state to transition to */
@Serializable(with = NavigationFlowActionState.Serializer::class)
public class NavigationFlowActionState internal constructor(override val node: Node) :
    NavigationFlowTransitionableState(node),
    NodeWrapper {

    override val stateType: NavigationFlowStateType = ACTION

    /**
     * An expression to execute.
     * The return value determines the transition to take
     */
    public val exp: Expression by NodeSerializableField(Expression.serializer())

    internal object Serializer : NodeWrapperSerializer<NavigationFlowActionState>(::NavigationFlowActionState, ACTION.name)
}

/** An END state of the flow */
@Serializable(with = NavigationFlowEndState.Serializer::class)
public class NavigationFlowEndState internal constructor(override val node: Node) :
    NavigationFlowState(),
    NodeWrapper,
    Map<String, Any?> by node {

    override val stateType: NavigationFlowStateType = END

    /**
     * A description of _how_ the flow ended.
     * If this is a flow started from another flow, the outcome determines the flow transition
     */
    public val outcome: String by NodeSerializableField(String.serializer()) { "" }

    internal object Serializer : NodeWrapperSerializer<NavigationFlowEndState>(::NavigationFlowEndState, END.name)
}

/**
 * External Flow states represent states in the FSM that can't be resolved internally in the player.
 * The flow will wait for the embedded application to manage moving to the next state via a transition
 */
@Serializable(with = NavigationFlowExternalState.Serializer::class)
public class NavigationFlowExternalState internal constructor(override val node: Node) :
    NavigationFlowTransitionableState(node),
    NodeWrapper {

    override val stateType: NavigationFlowStateType = EXTERNAL

    /** Getter for any additional properties */
    public operator fun get(name: String): Any? = node[name]

    internal object Serializer : NodeWrapperSerializer<NavigationFlowExternalState>(::NavigationFlowExternalState, EXTERNAL.name)
}

@Serializable(with = NavigationFlowFlowState.Serializer::class)
public class NavigationFlowFlowState internal constructor(override val node: Node) :
    NavigationFlowTransitionableState(node),
    NodeWrapper {

    override val stateType: NavigationFlowStateType = FLOW

    internal object Serializer : NodeWrapperSerializer<NavigationFlowFlowState>(::NavigationFlowFlowState, FLOW.name)
}

/** A state representing a view */
@Serializable(with = NavigationFlowViewState.Serializer::class)
public class NavigationFlowViewState internal constructor(override val node: Node) :
    NavigationFlowTransitionableState(node),
    NodeWrapper {

    override val stateType: NavigationFlowStateType = VIEW

    internal object Serializer : NodeWrapperSerializer<NavigationFlowViewState>(::NavigationFlowViewState, VIEW.name)
}
