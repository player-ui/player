package com.intuit.player.plugins.coroutines

import com.intuit.player.jvm.core.plugins.Plugin
import com.intuit.player.jvm.utils.test.PlayerTest
import com.intuit.player.jvm.utils.test.simpleFlowString
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
