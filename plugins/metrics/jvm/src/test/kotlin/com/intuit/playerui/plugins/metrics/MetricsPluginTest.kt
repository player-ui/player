package com.intuit.playerui.plugins.metrics

import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.runBlockingTest
import com.intuit.playerui.utils.test.simpleFlowString
import io.mockk.Called
import io.mockk.junit5.MockKExtension
import io.mockk.mockkObject
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate
import org.junit.jupiter.api.extension.ExtendWith
import kotlin.contracts.ExperimentalContracts

@ExtendWith(MockKExtension::class)
internal class MetricsPluginTest : PlayerTest() {
    private val renderEndHandler: RenderEndHandler = { _, _, _ -> }

    override val plugins = getMetricPlugin()

    private val plugin get() = player.metricsPlugin

    private fun getMetricPlugin(): List<Plugin> {
        mockkObject(renderEndHandler)
        return listOf(MetricsPlugin(renderEndHandler))
    }

    @TestTemplate
    fun `plugin is not null`() = assertNotNull(plugin)

    @TestTemplate
    fun `callback invoked on renderEnd call`() = runBlockingTest {
        player.start(simpleFlowString)
        plugin?.renderEnd()
        verify(exactly = 1) { renderEndHandler.invoke(any(), any(), any()) }
    }

    @TestTemplate
    fun `callback not invoked without renderEnd`() = runBlockingTest {
        player.start(simpleFlowString)
        player.inProgressState!!.transition("next")
        verify { renderEndHandler wasNot Called }
    }

    @OptIn(ExperimentalContracts::class)
    @TestTemplate
    fun `should trigger onFlowBegin hook`() {
        var onFlowBeginTapped = false
        var metricsVal: PlayerFlowMetrics? = null

        plugin?.hooks?.onFlowBegin?.tap("test") { metrics ->
            onFlowBeginTapped = true
            metricsVal = metrics
        }

        player.start(simpleFlowString)
        assertTrue(onFlowBeginTapped)
        assertNotNull(metricsVal)
    }

    @OptIn(ExperimentalContracts::class)
    @TestTemplate
    fun `should trigger onFlowEnd hook`() = runBlockingTest {
        var onFlowEndTapped = false
        var metricsVal: PlayerFlowMetrics? = null

        plugin?.hooks?.onFlowEnd?.tap("test") { metrics ->
            onFlowEndTapped = true
            metricsVal = metrics
        }

        val flow = player.start(simpleFlowString)
        assertFalse(onFlowEndTapped)

        player.inProgressState!!.transition("Next")
        val result = flow.await()

        assertEquals("DONE", result.endState.outcome)
        assertTrue(onFlowEndTapped)
        assertNotNull(metricsVal)
    }

    @OptIn(ExperimentalContracts::class)
    @TestTemplate
    fun `should trigger onRenderEnd hook`() {
        var onRenderEndTapped = false
        var timingVal: Timing? = null
        var renderMetricsVal: RenderMetrics? = null
        var playerFlowMetricsVal: PlayerFlowMetrics? = null

        plugin?.hooks?.onRenderEnd?.tap("test") { timing, renderMetrics, playerFlowMetrics ->
            onRenderEndTapped = true
            timingVal = timing
            renderMetricsVal = renderMetrics
            playerFlowMetricsVal = playerFlowMetrics
        }

        player.start(simpleFlowString)
        assertFalse(onRenderEndTapped)

        plugin?.renderEnd()
        assertTrue(onRenderEndTapped)
        assertNotNull(timingVal)
        assertNotNull(renderMetricsVal)
        assertNotNull(playerFlowMetricsVal)
    }
}

@ExtendWith(MockKExtension::class)
internal class RequestTimePluginTest : PlayerTest() {
    private val renderEndHandler: RenderEndHandler = { _, _, _ -> }
    private val getRequestTime: () -> Int = { 5 }

    override val plugins = getRequestTimePlugins()

    private val plugin get() = player.requestTimePlugin

    private fun getRequestTimePlugins(): List<Plugin> {
        mockkObject(renderEndHandler)
        return listOf(
            MetricsPlugin(renderEndHandler),
            RequestTimePlugin(getRequestTime),
        )
    }

    @TestTemplate
    fun `plugin is not null`() = assertNotNull(plugin)

    @TestTemplate
    fun `request time included in metrics`() = runBlockingTest {
        val flowMetrics = slot<PlayerFlowMetrics>()
        player.start(simpleFlowString)
        player.metricsPlugin?.renderEnd()
        verify(exactly = 1) { renderEndHandler.invoke(any(), any(), capture(flowMetrics)) }
        assertEquals(5, flowMetrics.captured.flow.requestTime)
    }
}
