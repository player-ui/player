package com.intuit.playerui.core.bridge

import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.utils.test.RuntimeTest
import io.mockk.every
import io.mockk.mockk
import io.mockk.verifySequence
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestTemplate

class NodeGetSymbolTest : RuntimeTest() {

    @Test
    fun `getSymbol injects helper`() {
        val runtime: Runtime<*> = mockk()
        val node: Node = mockk()

        every { node.runtime } returns runtime
        every { runtime.containsKey("getSymbol") } returns false
        every { runtime.execute(any()) } returns Unit
        every { runtime.getInvokable<String?>("getSymbol") } returns Invokable { "Symbol(world)" }

        val symbol = node.getSymbol("hello")
        assertEquals("Symbol(world)", symbol)

        verifySequence {
            runtime.containsKey("getSymbol")
            runtime.execute(any())
            runtime.getInvokable<String?>("getSymbol")
        }
    }

    @Test
    fun `getSymbol does not inject helper`() {
        val runtime: Runtime<*> = mockk()
        val node: Node = mockk()

        every { node.runtime } returns runtime
        every { runtime.containsKey("getSymbol") } returns true
        every { runtime.getInvokable<String?>("getSymbol") } returns Invokable { "Symbol(world)" }

        val symbol = node.getSymbol("hello")
        assertEquals("Symbol(world)", symbol)

        verifySequence {
            runtime.containsKey("getSymbol")
            runtime.getInvokable<String?>("getSymbol")
        }
    }

    @TestTemplate fun `getSymbol works with symbols`() {
        val wrapper = runtime.execute("({ ref: Symbol('hello') })") as Node
        assertNull(wrapper["ref"])
        assertEquals("Symbol(hello)", wrapper.getSymbol("ref"))
    }

    @TestTemplate fun `getSymbol doesn't blow up with non-symbols`() {
        val wrapper = runtime.execute("({ ref: 'not a symbol' })") as Node
        assertEquals("not a symbol", wrapper["ref"])
        assertNull(wrapper.getSymbol("ref"))
    }
}
