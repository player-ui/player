package com.intuit.player.jvm.graaljs.bridge.serialization

import com.intuit.player.jvm.core.bridge.Invokable
import com.intuit.player.jvm.graaljs.base.GraalTest
import com.intuit.player.jvm.graaljs.bridge.serialization.format.decodeFromGraalValue
import com.intuit.player.jvm.graaljs.extensions.blockingLock
import kotlinx.serialization.Serializable
import org.graalvm.polyglot.proxy.ProxyExecutable
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

internal class PrimitiveDecoding : GraalTest() {

    @Test
    fun `decode string primitive`() = format.context.blockingLock {
        Assertions.assertEquals("hello", format.decodeFromGraalValue(eval("js", "'hello'")))
    }

    @Test
    fun `decode boolean primitive`() = format.context.blockingLock {
        Assertions.assertEquals(true, format.decodeFromGraalValue<Boolean>(eval("js", "true")))
    }

    @Test
    fun `decode int primitive`() = format.context.blockingLock {
        Assertions.assertEquals(20, format.decodeFromGraalValue(eval("js", "20")))
    }

    @Test
    fun `decode double primitive`() = format.context.blockingLock {
        Assertions.assertEquals(2.2, format.decodeFromGraalValue(eval("js", "2.2")))
    }

    @Test
    fun `decode unit`() = format.context.blockingLock {
        Assertions.assertEquals(null, format.decodeFromGraalValue<Boolean?>(eval("js", "undefined")))
    }

    @Test
    fun `decode null`() = format.context.blockingLock {
        Assertions.assertEquals(null, format.decodeFromGraalValue<Boolean?>(eval("js", "null")))
    }
}

internal class FunctionDecoding : GraalTest() {

    @Test fun `decode typed lambda`() = format.context.blockingLock {
        val function = ProxyExecutable {
            "${it[0].asString()}: ${it[1].asInt()}"
        }
        val graalObject = eval("js", "new Object()").also {
            it.putMember("method", function)
        }

        Assertions.assertEquals("PLAYER: 1", function.execute(eval("js", "'PLAYER'"), eval("js", "1")))
        Assertions.assertEquals(
            "PLAYER: 2",
            format.decodeFromGraalValue<Function2<String, Int, String>>(graalObject.getMember("method"))("PLAYER", 2)
        )
    }

    @Test fun `decode invokable`() = format.context.blockingLock {
        val function = ProxyExecutable {
            "${it[0].asString()}: ${it[1].asInt()}"
        }
        val graalObject = eval("js", "new Object()").also {
            it.putMember("method", function)
        }

        Assertions.assertEquals("PLAYER: 1", function.execute(eval("js", "'PLAYER'"), eval("js", "1")))
        Assertions.assertEquals(
            "PLAYER: 2",
            format.decodeFromGraalValue<Invokable<String>>(graalObject.getMember("method"))("PLAYER", 2)
        )
    }

    @Test fun `decode kcallable`() = format.context.blockingLock {
        @Serializable
        data class Container(
            val method: (String, Int) -> String
        )

        val function = ProxyExecutable {
            "${it[0].asString()}: ${it[1].asInt()}"
        }

        Assertions.assertEquals("PLAYER: 1", function.execute(eval("js", "'PLAYER'"), eval("js", "1")))
        Assertions.assertEquals(
            "PLAYER: 2",
            format.decodeFromGraalValue<Container>(
                eval("js", "new Object()").also {
                    it.putMember("method", function)
                }
            ).method("PLAYER", 2)
        )
    }
}
