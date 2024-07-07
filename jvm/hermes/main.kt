
import com.facebook.soloader.nativeloader.NativeLoader
import com.intuit.playerui.bridge.loader.ResourceLoaderDelegate
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime
import com.intuit.playerui.hermes.bridge.runtime.HermesRuntime.Config
import com.intuit.playerui.hermes.extensions.UnsafeRuntimeThreadAPI
import com.intuit.playerui.hermes.extensions.UnsafeRuntimeThreadContext
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.Value.Companion.createFromJson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlin.system.exitProcess

@OptIn(UnsafeRuntimeThreadAPI::class)
public fun main(): Unit = with(UnsafeRuntimeThreadContext) {
    try {
        NativeLoader.init(ResourceLoaderDelegate())
        println("Trying to execute 2 + 2")
        val runtime = HermesRuntime()
        println("Runtime: $runtime")
        val four = runtime.evaluateJavaScript("2 + 2")
        four.asNumber().let(::println)

        runBlocking(Dispatchers.Default) {
            val result = runtime.evaluateJavaScript("20 + 20")
            result.asNumber().let(::println)
            result.let(::println)
            result.toString(runtime).let(::println)
        }

        val json = createFromJson(runtime, buildJsonObject { put("hello", "world") })
        json.isObject().let(::println)
        json.asObject(runtime).let(::println)
        json.asObject(runtime).getProperty(runtime, "hello").toString(runtime).let(::println)

        val func = runtime.evaluateJavaScript("((i) => 3 + i)")
        func.isObject().let(::println)
        func.asObject(runtime).isFunction(runtime).let(::println)
        val funcRes = func.asObject(runtime).asFunction(runtime).call(runtime, Value.from(3))
        funcRes.let(::println)
        funcRes.toString(runtime).let(::println)

        val symbol = runtime.evaluateJavaScript("Symbol.for('hello-world')")
        symbol.isSymbol().let(::println)
        symbol.asSymbol(runtime).toString(runtime).let(::println)

        val r2 = HermesRuntime(Config(false))
        r2.global().getProperty(r2, "Intl").toString(r2).let(::println)
        val r3 = HermesRuntime(Config(true))
        r3.global().getProperty(r3, "Intl").toString(r3).let(::println)
        r3.global().getProperty(r3, "Intl").toString(r2).let(::println)
    } catch (t: Throwable) {
        t.printStackTrace()
        exitProcess(1)
    }
    exitProcess(0)
}
