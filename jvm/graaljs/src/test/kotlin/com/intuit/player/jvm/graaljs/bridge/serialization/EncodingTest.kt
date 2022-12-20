package com.intuit.player.jvm.graaljs.bridge.serialization

import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.graaljs.base.GraalTest
import com.intuit.player.jvm.graaljs.bridge.serialization.format.encodeToGraalValue
import com.intuit.player.jvm.graaljs.extensions.blockingLock
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class PrimitiveEncoding : GraalTest() {

    @Test
    fun `encode string primitive`() = format.context.blockingLock {
        eval("js", "'hello'").assertEquivalent(format.encodeToGraalValue("hello"))
    }

    @Test
    fun `encode boolean primitive`() = format.context.blockingLock {
        eval("js", "true").assertEquivalent(format.encodeToGraalValue(true))
    }

    @Test
    fun `encode int primitive`() = format.context.blockingLock {
        eval("js", "20").assertEquivalent(format.encodeToGraalValue(20))
    }

    @Test
    fun `encode double primitive`() = format.context.blockingLock {
        eval("js", "2.2").assertEquivalent(format.encodeToGraalValue(2.2))
    }

    @Test
    fun `encode long primitive`() = format.context.blockingLock {
        eval("js", "20.0").assertEquivalent(format.encodeToGraalValue(20L))
    }

    @Test
    fun `encode unit`() = format.context.blockingLock {
        eval("js", "undefined").assertEquivalent(format.encodeToGraalValue(Unit))
    }

    @Test
    fun `encode null`() = format.context.blockingLock {
        eval("js", "null").assertEquivalent(format.encodeToGraalValue<Int?>(null))
    }
}

internal class FunctionEncoding : GraalTest() {

    @Test fun `encode typed lambda`() = format.context.blockingLock {
        val callback = { p0: String, p1: Int -> "$p0: $p1" }

        Assertions.assertEquals("PLAYER: 1", callback("PLAYER", 1))
        Assertions.assertEquals(
            "PLAYER: 2",
            format.encodeToGraalValue(callback).execute("PLAYER", 2).asString()
        )
    }

    @Test fun `encode invokable`() = format.context.blockingLock {
        val callback = Invokable { (p0, p1) -> "$p0: $p1" }

        Assertions.assertEquals("PLAYER: 1", callback("PLAYER", 1))
        Assertions.assertEquals(
            "PLAYER: 2",
            format.encodeToGraalValue(callback).execute("PLAYER", 2).asString()
        )
    }

    @Test fun `encode kcallable`() = format.context.blockingLock {
        class Container {
            fun callback(p0: String, p1: Int) = "$p0: $p1"
        }

        val callback = Container()::callback

        Assertions.assertEquals("PLAYER: 1", callback("PLAYER", 1))
        Assertions.assertEquals(
            "PLAYER: 2",
            format.encodeToGraalValue(callback).execute("PLAYER", 2).asString()
        )
    }
}
