package com.intuit.playerui.hermes.bridge.runtime

import com.facebook.jni.HybridData
import com.facebook.soloader.nativeloader.NativeLoader
import com.intuit.playerui.hermes.bridge.ResourceLoaderDelegate
import com.intuit.playerui.jsi.Runtime
import com.intuit.playerui.jsi.Value
import com.intuit.playerui.jsi.Value.Companion.createFromJson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlin.system.exitProcess

public class HermesRuntime(mHybridData: HybridData) : Runtime(mHybridData) {

    public companion object {
        init {
            // TODO: Iterate on load order,
            //  1.a. native loader?
            //  1. fbjni? -- MARK: This actually doesn't need to be loaded manually - just reference FBJNI and it'll load the native lib through NativeLoader
            //                     which means we actually should probably just delegate loading through the NativeLoader entirely since that'll ensure we set
            //                     things up correctly for dependent native libs, as well as our custom native libs.
            //                     This _does_ rely on the SoLoader, which is technically Android only? But maybe that's why things are loaded through NativeLoader?
            //  2. hermes (does this rely on fbjni?)
            //  3. jsi (almost certain this'd need to be before hermes)
            //  4. hermes_jni (our code)
            NativeLoader.loadLibrary("fbjni")
            NativeLoader.loadLibrary("jsi")
            NativeLoader.loadLibrary("hermes")
            NativeLoader.loadLibrary("hermes_jni")
        }

        @JvmStatic public external fun create(): HermesRuntime

        public operator fun invoke(): HermesRuntime = create()
    }

//    @DoNotStrip override val mHybridData: HybridData

//    init {
//        mHybridData = initHybrid()
//    }

//    private external fun initHybrid(): HybridData

    public external fun execute(script: String): Value
}

public fun main() {
    try {
        NativeLoader.init(ResourceLoaderDelegate())
        println("Trying to execute 2 + 2")
        val runtime = HermesRuntime()
        println("Runtime: $runtime")
        val four = runtime.execute("2 + 2")
        four.asNumber().let(::println)

        runBlocking(Dispatchers.Default) {
            val result = runtime.execute("20 + 20")
            result.asNumber().let(::println)
            result.let(::println)
            result.toString(runtime).let(::println)
        }

        val json = createFromJson(runtime, buildJsonObject { put("hello", "world") })
        json.isObject().let(::println)
        json.asObject(runtime).let(::println)
        json.asObject(runtime).getProperty(runtime, "hello").toString(runtime).let(::println)

        val func = runtime.execute("((i) => 3 + i)")
        func.isObject().let(::println)
        func.asObject(runtime).isFunction(runtime).let(::println)
        val funcRes = func.asObject(runtime).asFunction(runtime).call(runtime, Value.from(3))
        funcRes.let(::println)
        funcRes.toString(runtime).let(::println)
    } catch (t: Throwable) {
        t.printStackTrace()
        exitProcess(1)
    }
    exitProcess(0)
}
