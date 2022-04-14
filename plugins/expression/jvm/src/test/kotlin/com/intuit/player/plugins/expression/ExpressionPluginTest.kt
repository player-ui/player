package com.intuit.player.plugins.expression

import com.intuit.player.jvm.core.expressions.ExpressionEvaluator
import com.intuit.player.jvm.core.expressions.evaluate
import com.intuit.player.jvm.core.plugins.Plugin
import com.intuit.player.jvm.core.plugins.findPlugin
import com.intuit.player.jvm.utils.test.PlayerTest
import com.intuit.player.jvm.utils.test.setupPlayer
import com.intuit.player.jvm.utils.test.simpleFlowString
import org.amshove.kluent.*
import org.junit.jupiter.api.TestTemplate

internal class ExpressionPluginTest : PlayerTest() {

    override val plugins: List<Plugin> = listOf(
        ExpressionPlugin(
            "myExpression" to { args ->
                println(args)
                when {
                    args.isNullOrEmpty() -> "hi"
                    else -> "bye"
                }
            },
            "MyExpression2" to { null }
        )
    )

    private val expressionPlugin get() = player.findPlugin<ExpressionPlugin>()!!

    @TestTemplate
    fun `should register custom expression`() {
        player.plugins.`should not be null`()
        player.findPlugin<ExpressionPlugin>().`should not be null`()
    }

    @TestTemplate
    fun `apply is called`() {
        player.findPlugin<ExpressionPlugin>()?.instance.`should not be null`()
    }

    @TestTemplate
    fun `custom expression is evaluated`() {
        player.start(simpleFlowString)
        val evaluator = player.state
        player.state `should be instance of` ExpressionEvaluator::class
        evaluator as ExpressionEvaluator

        evaluator.evaluate("@[ myExpression(1,2,3) ]@") `should be equal to` "bye"
        evaluator.evaluate("myExpression(1,2,3)") `should be equal to` "bye"
        evaluator.evaluate("@[ myExpression() ]@") `should be equal to` "hi"
        evaluator.evaluate("myExpression()") `should be equal to` "hi"
    }

    @TestTemplate
    fun `empty expression map is valid`() {
        setupPlayer(ExpressionPlugin(emptyMap()))
        val expressionMap = expressionPlugin.instance.getObject("expressions")!!
        expressionMap.keys.`should be empty`()
    }
}
