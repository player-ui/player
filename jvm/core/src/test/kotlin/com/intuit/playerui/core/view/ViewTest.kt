package com.intuit.playerui.core.view

import com.intuit.playerui.core.NodeBaseTest
import io.mockk.every
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class ViewTest : NodeBaseTest() {
    private val hooks by lazy {
        ViewHooks(node)
    }

    @BeforeEach
    fun setUpMocks() {
        every { node.getObject("hooks") } returns node
        every { node.getSerializable<ViewHooks>("hooks", any()) } returns hooks
        every { node.nativeReferenceEquals(any()) } returns false
    }

    val view by lazy {
        View(node)
    }

    @Test
    fun hooks() {
        assertEquals(view.hooks, hooks)
    }
}
