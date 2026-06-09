package com.intuit.playerui.core.player

import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.runBlockingTest
import com.intuit.playerui.utils.test.simpleFlowString
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.TestTemplate

/**
 * Verifies that the JVM [Player.start] overload forwards the optional content
 * [format]/[version] meta through to the JS player's `transformContent` hook.
 *
 * A tiny inline JS content plugin taps `transformContent` and records the
 * `meta.format` it observed on a runtime global. If the meta were dropped (the
 * previous behavior, where `start` invoked the JS player with only the flow
 * node), the hook would observe the default `"player"` format instead.
 */
internal class StartContentMetaTest : PlayerTest() {
    private val contentPlugin = JSScriptPluginWrapper.from(
        name = "TestContentPlugin",
        script =
            """
            globalThis.__observedFormat = null;
            var TestContentPlugin = (function () {
                function TestContentPlugin() {}
                TestContentPlugin.prototype.apply = function (player) {
                    player.hooks.transformContent.tap('test-content', function (content, meta) {
                        globalThis.__observedFormat = meta && meta.format;
                        return content;
                    });
                };
                return TestContentPlugin;
            })();
            """.trimIndent(),
    )

    override val plugins: List<Plugin> = listOf(contentPlugin)

    private fun lastObservedFormat(): String? = runtime.execute("globalThis.__observedFormat") as? String

    @TestTemplate
    fun `start forwards explicit format to transformContent hook`() = runBlockingTest {
        player.start(simpleFlowString, StartOptions(format = "a2ui"))

        assertEquals("a2ui", lastObservedFormat())
    }

    @TestTemplate
    fun `start without format defaults to player format`() = runBlockingTest {
        player.start(simpleFlowString)

        assertEquals("player", lastObservedFormat())
    }
}
