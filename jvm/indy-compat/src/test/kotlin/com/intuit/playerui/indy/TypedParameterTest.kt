package com.intuit.playerui.indy

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.utils.test.RuntimeTest
import kotlinx.serialization.Serializable
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate

@Serializable
internal data class Config(val name: String, val count: Int)

/**
 * A lambda registered with [add] declares the types it accepts, and arguments coming back from JS
 * are decoded against them.
 *
 * This is what lets a whole JS number reach a `Long` parameter as a `Long`: JS has one number type,
 * so without the declared type the runtime can only guess a JVM box (and guesses [Int]). Under
 * class-mode lambda codegen the compiler inserted a `Number.longValue()` bridge that hid the
 * mismatch; invokedynamic codegen enforces the declared type exactly, so the conversion has to
 * happen when the argument is decoded.
 *
 * The same mechanism decodes objects into whatever type the parameter declares, rather than always
 * handing back a [Node].
 */
internal class TypedParameterTest : RuntimeTest() {
    @TestTemplate
    fun `whole numbers reach the declared numeric type`() {
        runtime.add("asLong") { v: Long -> "long:$v" }
        runtime.add("asInt") { v: Int -> "int:$v" }
        runtime.add("asDouble") { v: Double -> "double:$v" }

        // all three receive the same JS number literal
        assertEquals("long:500", runtime.execute("asLong(500)"))
        assertEquals("int:500", runtime.execute("asInt(500)"))
        assertEquals("double:500.0", runtime.execute("asDouble(500)"))
    }

    @TestTemplate
    fun `fractional numbers reach the declared numeric type`() {
        runtime.add("asDouble") { v: Double -> "double:$v" }

        assertEquals("double:1.5", runtime.execute("asDouble(1.5)"))
    }

    @TestTemplate
    fun `numbers are decoded per parameter position`() {
        runtime.add("mixed") { a: Long, b: Int, c: Double -> "$a|$b|$c" }

        assertEquals("1|2|3.0", runtime.execute("mixed(1, 2, 3)"))
    }

    @TestTemplate
    fun `objects decode into a declared serializable type`() {
        var received: Config? = null
        runtime.add("takesConfig") { c: Config -> received = c; "ok" }

        runtime.execute("takesConfig({name: 'player', count: 2})")

        assertEquals(Config("player", 2), received)
    }

    @TestTemplate
    fun `objects still arrive as a Node when that is what is declared`() {
        var received: Node? = null
        runtime.add("takesNode") { n: Node -> received = n; "ok" }

        runtime.execute("takesNode({name: 'player'})")

        assertEquals("player", received?.getString("name"))
    }

    @TestTemplate
    fun `objects fall back to a Node when the parameter is untyped`() {
        var received: Any? = null
        runtime.add("takesAny") { a: Any? -> received = a; "ok" }

        runtime.execute("takesAny({name: 'player'})")

        assertTrue(received is Node, "expected a Node, got ${received?.let { it::class.simpleName }}")
    }
}
