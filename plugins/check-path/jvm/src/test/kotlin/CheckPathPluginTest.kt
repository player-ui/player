package com.intuit.player.plugins.checkpath

import com.intuit.player.jvm.utils.test.PlayerTest
import com.intuit.player.jvm.utils.test.simpleFlowString
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestTemplate

internal class CheckPathPluginTest : PlayerTest() {

    override val plugins by lazy {
        listOf(CheckPathPlugin())
    }

    @BeforeEach
    fun before() {
        player.start(simpleFlowString)
    }

    @TestTemplate
    fun getAsset() {
        val collection = player.getAsset("view-1")
        assertNotNull(collection)
        assertNotNull(collection?.get("values"))
    }
}
