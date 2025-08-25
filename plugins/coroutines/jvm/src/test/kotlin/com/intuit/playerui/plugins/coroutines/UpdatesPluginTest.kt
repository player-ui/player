package com.intuit.playerui.plugins.coroutines

import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.simpleFlowString
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.TestTemplate
import kotlin.concurrent.thread

internal class UpdatesPluginTest : PlayerTest() {
    override val plugins: List<Plugin> = listOf(UpdatesPlugin())

    @TestTemplate
    fun `test wait for updates`() {
        val assertions = thread {
            assertEquals("collection", player.waitForUpdates(5000)?.id)
        }
        player.start(simpleFlowString)
        assertions.join()
    }
}
