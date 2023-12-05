package com.intuit.player.jvm.perf.junit

import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.bridge.getInvokable
import com.intuit.player.jvm.core.bridge.runtime.add
import com.intuit.player.jvm.core.player.JSPlayerConfig
import com.intuit.player.jvm.core.plugins.JSPluginWrapper
import com.intuit.player.jvm.core.plugins.Plugin
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate

internal class RuntimePerfTest : JSEngineTest() {

    @TestTemplate
    fun runObjectScript() {
        var name: String? = null
        var age: Int? = null
        captureTime {
            runtime.execute(objectScript)
            val person = runtime.getObject("person")
            name = person?.getString("name")
            age = person?.getInt("age")
        }
        assertTrue(name == "Joe")
        assertTrue(age == 25)
    }

    @TestTemplate
    fun runJSFunction() {
        runtime.execute(objectScript)
        val person = runtime.getObject("person")
        var resultString = ""
        captureTime {
            resultString = runtime.getInvokable<String>("getAge")?.invoke(person) ?: ""
        }
        assert(resultString.isNotEmpty())
        assertEquals("Joe is 25 years old", resultString)
    }

    @TestTemplate
    fun executePlayerScript() = captureTime {
        runtime.execute(this@RuntimePerfTest::class.java.classLoader.getResource("core/player/dist/player.prod.js")!!.readText())
    }

    @TestTemplate
    fun createPlayer() {
        val plugins = listOf<Plugin>()
        val config = plugins
            .filterIsInstance<JSPluginWrapper>()
            .let(::JSPlayerConfig)
        var player: Node? = null
        runtime.execute(this@RuntimePerfTest::class.java.classLoader.getResource("core/player/dist/player.prod.js")!!.readText())
        captureTime {
            runtime.add("config", config)
            player = runtime.execute("new Player.Player(config)") as? Node
        }
        assertNotNull(player)
        assert(player?.isUndefined() == false)
        assertNotNull(player?.get("hooks"))
    }
}
