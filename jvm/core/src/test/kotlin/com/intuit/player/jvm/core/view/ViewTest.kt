package com.intuit.player.jvm.core.view

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.bridge.Node
import io.mockk.every
import io.mockk.impl.annotations.MockK
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class ViewTest : NodeBaseTest() {
    @MockK
    private lateinit var hooksNode: Node

    @BeforeEach
    fun setUpMocks() {
        every { node.getObject("hooks") } returns hooksNode
    }

    val view by lazy {
        View(node)
    }

    @Test
    fun hooks() {
        assertNotNull(view.hooks)
    }
}
