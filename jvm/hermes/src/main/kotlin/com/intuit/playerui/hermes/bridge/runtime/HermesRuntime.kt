package com.intuit.playerui.hermes.bridge.runtime

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.facebook.soloader.nativeloader.NativeLoader
import com.intuit.playerui.hermes.bridge.ResourceLoaderDelegate

public class HermesRuntime {

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
            try {
                NativeLoader.loadLibrary("fbjni")
                NativeLoader.loadLibrary("jsi")
                NativeLoader.loadLibrary("hermes")
                NativeLoader.loadLibrary("hermes_jni")
            } catch (e: Throwable) {
                e.printStackTrace()
                throw e
            }
        }
    }

    @DoNotStrip private val mHybridData: HybridData

    init {
        mHybridData = initHybrid()
    }

    private external fun initHybrid(): HybridData

    public external fun execute(script: String): String
}

public fun main(args: Array<String>) {
    NativeLoader.init(ResourceLoaderDelegate())
    println("Trying to execute 2 + 2")
    val runtime = HermesRuntime()
    println("Runtime: $runtime")
    runtime.execute("2 + 2").also(::println)
}
