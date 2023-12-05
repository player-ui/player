package com.intuit.player.jvm.core.view

import com.intuit.player.jvm.core.NodeBaseTest
import com.intuit.player.jvm.core.bridge.Node
import io.mockk.every
import io.mockk.impl.annotations.MockK
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class ViewControllerTest : NodeBaseTest() {

    @MockK
    private lateinit var hookNode: Node

    @MockK
    private lateinit var viewNode: Node

    private val viewController by lazy {
        ViewController(node)
    }

    @BeforeEach
    fun setUpMock() {
        every { node.getObject(any()) } returns node
        every { node.getSerializable<Any>("hooks", any()) } returns ViewController.Hooks(hookNode)
        every { node.getSerializable<Any>("currentView", any()) } returns View(viewNode)
        every { node.nativeReferenceEquals(any()) } returns true
    }

    @Test
    fun hooks() {
        assertNotNull(viewController.hooks)
    }

    @Test
    fun currentView() {
        assertNotNull(viewController.currentView)
    }
}
