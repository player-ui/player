package com.intuit.playerui.core.player

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.services.KotlinDataController
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.runBlockingTest
import com.intuit.playerui.utils.test.simpleFlowString
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference

/**
 * End-to-end native substitution. A Kotlin-owned [KotlinDataController] is
 * supplied via [ServicesConfig.data], the bridge surfaces it to JS as an
 * `IDataController`-shaped object, and core/player uses it for the flow. JS
 * code calling `dataController.get(...)` lands in our Kotlin lambda, which
 * tags string results with `[kotlin-native] ` — proving the read path is in
 * Kotlin, not the default JS DataController.
 */
@OptIn(ExperimentalPlayerApi::class)
internal class HeadlessPlayerServicesTest : PlayerTest() {
    override val plugins: List<Plugin> = emptyList()

    @TestTemplate
    fun `kotlin data service factory receives the ctx core would pass to the default constructor`() = runBlockingTest {
        val invocationCount = AtomicInteger(0)
        val capturedCtx = AtomicReference<Node?>(null)

        val services = ServicesConfig(
            data = DataServiceFactory { ctx ->
                invocationCount.incrementAndGet()
                capturedCtx.set(ctx)
                // null falls through to the default JS DataController.
                null
            },
        )

        val player = HeadlessPlayer(
            plugins = emptyList(),
            explicitRuntime = runtime,
            config = runtime.config,
            services = services,
        )

        val flow = player.start(simpleFlowString)
        assertEquals(1, invocationCount.get())

        val ctx = capturedCtx.get()
        assertNotNull(ctx)
        assertNotNull(ctx!!.getObject("pathResolver"))
        assertTrue(ctx.getList("middleware")?.isNotEmpty() == true)

        player.inProgressState?.transition("Next")
        val result = flow.await()
        assertEquals("DONE", result.endState.outcome)
    }

    @TestTemplate
    fun `native KotlinDataController substitutes for the JS default and serves reads from kotlin`() = runBlockingTest {
        // Seed initial data via the native controller. The getTransformer
        // prefixes string reads with `[kotlin-native] ` so the test can verify
        // the read landed in Kotlin, not the default JS DataController.
        val nativeController = KotlinDataController(
            initialData = mapOf("greeting" to "world"),
            getTransformer = { _, v -> if (v is String) "[kotlin-native] $v" else v },
        )

        val services = ServicesConfig(
            data = DataServiceFactory { _ -> nativeController.jsClassMirror },
        )

        val player = HeadlessPlayer(
            plugins = emptyList(),
            explicitRuntime = runtime,
            config = runtime.config,
            services = services,
        )

        player.start(simpleFlowString)

        // Reach into the JS player and ask its data controller to .get("greeting").
        // The bridge sees our jsClassMirror as a JS Node; calling .get goes through the
        // Node's `get` Invokable, which lands in our Kotlin lambda. If the
        // Kotlin path is what ran, the value is prefixed with `[kotlin-native] `.
        val state = player.inProgressState
        assertNotNull(state)
        val result = state!!.controllers.data.get("greeting")
        assertEquals("[kotlin-native] world", result)
    }
}
