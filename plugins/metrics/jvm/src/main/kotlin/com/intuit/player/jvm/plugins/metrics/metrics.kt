package com.intuit.player.jvm.plugins.metrics

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.NodeWrapper
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.player.jvm.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.player.jvm.core.bridge.serialization.serializers.PolymorphicNodeWrapperSerializer
import com.intuit.player.jvm.core.player.PlayerException
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer

internal class TimingSerializer : PolymorphicNodeWrapperSerializer<Timing>() {
    override fun selectDeserializer(node: Node): KSerializer<out Timing> {
        // TODO: Use local class discriminator
        return when (node.getBoolean("completed")) {
            true -> CompletedTiming.serializer()
            false -> IncompleteTiming.serializer()
            else -> throw PlayerException("Timing for metrics must either be completed or incomplete")
        }
    }
}

@Serializable(with = TimingSerializer::class)
public sealed class Timing(override val node: Node) : NodeWrapper {
    /** Time this duration started (ms) */
    public val startTime: Double? by NodeSerializableField(Double.serializer().nullable)
}

@Serializable(with = CompletedTiming.Serializer::class)
public class CompletedTiming internal constructor(override val node: Node) : Timing(node) {
    public val completed: Boolean = true

    /** The time in (ms) that the process ended */
    public val endTime: Double? by NodeSerializableField(Double.serializer().nullable)

    /** The elapsed time of this event (ms) */
    public val duration: Int? by NodeSerializableField(Int.serializer().nullable)

    internal object Serializer : NodeWrapperSerializer<CompletedTiming>(::CompletedTiming)
}

@Serializable(with = IncompleteTiming.Serializer::class)
public class IncompleteTiming internal constructor(override val node: Node) : Timing(node) {
    public val completed: Boolean = false
    internal object Serializer : NodeWrapperSerializer<IncompleteTiming>(::IncompleteTiming)
}

public sealed class NodeMetrics(override val node: Node) : Timing(node) {

    /** The type of the flow-state  */
    public val stateType: String by NodeSerializableField(String.serializer())

    /** The name of the flow-state */
    public val stateName: String by NodeSerializableField(String.serializer())
}

@Serializable(with = RenderMetrics.Serializer::class)
public class RenderMetrics(override val node: Node) : NodeMetrics(node) {
    /** Timing representing the initial render */
    public val render: Timing by NodeSerializableField(Timing.serializer())

    internal object Serializer : NodeWrapperSerializer<RenderMetrics>(::RenderMetrics)
}

@Serializable(with = MetricsFlow.Serializer::class)
public class MetricsFlow(override val node: Node) : NodeWrapper {
    /** The id of the flow these metrics are for */
    public val id: String? by NodeSerializableField(String.serializer().nullable)

    /** request time */
    public val requestTime: Int? by NodeSerializableField(Int.serializer().nullable)

    /** A timing measuring until the first interactive render */
    public val interactive: Timing by NodeSerializableField(Timing.serializer())

    internal object Serializer : NodeWrapperSerializer<MetricsFlow>(::MetricsFlow)
}

@Serializable(with = PlayerFlowMetrics.Serializer::class)
public class PlayerFlowMetrics(override val node: Node) : Timing(node) {
    /** All metrics about a running flow */
    public val flow: MetricsFlow by NodeSerializableField(MetricsFlow.serializer())
    internal object Serializer : NodeWrapperSerializer<PlayerFlowMetrics>(::PlayerFlowMetrics)
}
