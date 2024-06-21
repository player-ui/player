package com.intuit.playerui.hermes.bridge

import com.facebook.soloader.nativeloader.NativeLoaderDelegate
import java.io.InputStream
import kotlin.io.path.createTempFile
import kotlin.io.path.outputStream

// TODO: Is there a perf hit from loading a SO from resources? Does it matter since it has to be that way on Android?
internal class ResourceLoaderDelegate : NativeLoaderDelegate {
    override fun loadLibrary(shortName: String, flags: Int): Boolean {
        // TODO: Somehow reconcile shortName w/ path to long?
        //       1. try just shortName.so/dylib
        //       2. try just libshortName.so/dylib
        //       3. try shortName/shortName.so/dylib
        //       4. try shortName/libshortName.so/dylib
        //       5. try shortName/lib/libshortName.so/dylib
        val resource = getResourceAsStream("$shortName.so")
            ?: getResourceAsStream("$shortName.dylib")
            ?: getResourceAsStream("lib$shortName.so")
            ?: getResourceAsStream("lib$shortName.dylib")
            ?: getResourceAsStream("$shortName/$shortName.so")
            ?: getResourceAsStream("$shortName/$shortName.dylib")
            ?: getResourceAsStream("$shortName/lib$shortName.so")
            ?: getResourceAsStream("$shortName/lib$shortName.dylib")
            ?: getResourceAsStream("$shortName/lib/$shortName.so")
            ?: getResourceAsStream("$shortName/lib/$shortName.dylib")
            ?: getResourceAsStream("$shortName/lib/lib$shortName.so")
            ?: getResourceAsStream("$shortName/lib/lib$shortName.dylib")
            // TODO: Potentially delegate to SystemDelegate?
            ?: throw UnsatisfiedLinkError("Unable to load resource for $shortName")

        val rewritten = resource.writeTemp("lib$shortName", ".so")
        System.load(rewritten.toString())
        return true
    }

    override fun getLibraryPath(libName: String?) = null

    override fun getSoSourcesVersion(): Int = 0

    private fun InputStream.writeTemp(prefix: String? = null, suffix: String? = ".so") = use {
        createTempFile(prefix, suffix).apply { outputStream().use(::copyTo) }
    }

    companion object {
        private val classLoader = ResourceLoaderDelegate::class.java.classLoader

        private fun getResourceAsStream(resourceName: String): InputStream? =
            classLoader.getResourceAsStream(resourceName)?.also { println("found $resourceName") }
    }
}