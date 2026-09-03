package com.intuit.playerui.indy

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.getInvokable
import com.intuit.playerui.core.bridge.invokeVararg
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.utils.test.RuntimeTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestTemplate

/**
 * Proves Kotlin functions still cross into a JS runtime when compiled the way K2 compiles them.
 *
 * This module is built with `-Xlambdas=indy -Xsam-conversions=indy` (see the BUILD file), so every
 * lambda below is spun by LambdaMetafactory as a hidden class implementing only its [Function]
 * interface - not a named class extending `kotlin.jvm.internal.Lambda`. That is exactly what a
 * consumer on K2 produces, and what forced them to pin `-Xlambdas=class` before.
 *
 * If these pass, consumers do not need those flags.
 */
internal class IndyLambdaTest : RuntimeTest() {
    /**
     * Guard for the rest of the file.
     *
     * [kt_kotlinc_options] attributes are filtered against the bundled compiler's capabilities, so
     * an unsupported option is dropped silently rather than failing the build. Without this check a
     * regression there would leave every test below compiling in `class` mode and passing for the
     * wrong reason.
     */
    @Test
    fun `this module really is compiled with indy lambdas`() {
        val lambda: (String) -> String = { "got:$it" }

        assertFalse(
            lambda is kotlin.jvm.internal.FunctionBase<*>,
            "expected an invokedynamic lambda, but got a class-mode one (${lambda::class}) - " +
                "the indy kotlinc options are not reaching this target",
        )
        assertTrue(lambda is Function1<*, *>)
    }

    @Test
    fun `invokeVararg dispatches on an indy lambda`() {
        // nullable params, since padding a missing arg passes null - a non-null parameter would
        // fail the compiler's intrinsic null check rather than anything to do with codegen mode
        val fn = { a: String?, b: String? -> "$a-$b" }

        assertEquals("x-y", fn.invokeVararg("x", "y"))
        // extras are trimmed, missing args padded with null
        assertEquals("x-y", fn.invokeVararg("x", "y", "z"))
        assertEquals("x-null", fn.invokeVararg("x"))
    }

    @TestTemplate
    fun `encodes indy lambdas of each arity`() {
        runtime.add("noArgs") { "none" }
        runtime.add("oneArg") { a: String -> "one:$a" }
        runtime.add("twoArgs") { a: String, b: String -> "two:$a-$b" }

        assertEquals("none", runtime.execute("noArgs()"))
        assertEquals("one:a", runtime.execute("oneArg('a')"))
        assertEquals("two:a-b", runtime.execute("twoArgs('a','b')"))
    }

    @TestTemplate
    fun `pads and trims args from JS`() {
        runtime.add("twoArgs") { a: String?, b: String? -> "$a-$b" }

        assertEquals("a-b", runtime.execute("twoArgs('a','b')"))
        assertEquals("a-b", runtime.execute("twoArgs('a','b','extra')"))
        assertEquals("a-null", runtime.execute("twoArgs('a')"))
    }

    @TestTemplate
    fun `encodes an indy lambda declared as Any`() {
        // the shape plugins use when putting handlers into a map
        val handlers: Map<String, Any?> = mapOf("onEvent" to { a: String -> "handled:$a" })
        val encoded = runtime.serialize(handlers) as Node

        assertEquals("handled:x", encoded.getInvokable<String>("onEvent")?.invoke("x"))
    }

    @TestTemplate
    fun `encodes an indy SAM conversion`() {
        // -Xsam-conversions=indy is a distinct codegen path from -Xlambdas=indy
        val handler = Handler { "sam:$it" }
        runtime.add("viaSam") { a: String -> handler.handle(a) }

        assertEquals("sam:x", runtime.execute("viaSam('x')"))
    }

    @TestTemplate
    fun `encodes a method reference`() {
        // control: callable references stay reflectable under indy, unlike lambdas
        runtime.add("viaRef", ::describe)

        assertEquals("ref:x", runtime.execute("viaRef('x')"))
    }

    private fun interface Handler {
        fun handle(value: String): String
    }
}

/**
 * Top-level so the [KCallable] path can reflectively invoke it. A private companion member is not
 * accessible to kotlin-reflect, which fails independently of lambda codegen mode.
 */
internal fun describe(value: String): String = "ref:$value"
