package com.intuit.playerui.core.expressions

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable

/** Exists to provide a consistent interface for any structure that provides expression evaluation */
public interface ExpressionEvaluator {
    /** Evaluate each of the [expressions] and return the result of the last [Expression] */
    public fun evaluate(expressions: List<String>): Any?
}

/** Convenience helper to evaluate a single [expression] and return the result */
public fun ExpressionEvaluator.evaluate(expression: String): Any? = evaluate(listOf(expression))

/** Convenience helper to evaluate each of the [expressions] and return the result of the last [Expression] */
public fun ExpressionEvaluator.evaluate(vararg expressions: String): Any? = evaluate(expressions.toList())

/**
 * Evaluate an [expression] which could contain a single [Expression.Single.expression]
 * or a set of [Expression.Collection.expressions] and return the result
 */
public fun ExpressionEvaluator.evaluate(expression: Expression): Any? = when (expression) {
    is Expression.Single -> evaluate(expression.expression)
    is Expression.Collection -> evaluate(expression.expressions)
}

@Serializable(ExpressionController.Serializer::class)
public class ExpressionController(
    override val node: Node,
) : NodeWrapper,
    ExpressionEvaluator {
    private val evaluate: Invokable<Any>? by NodeSerializableFunction()

    override fun evaluate(expressions: List<String>): Any? = evaluate?.invoke(expressions)

    internal object Serializer : NodeWrapperSerializer<ExpressionController>(::ExpressionController)
}
