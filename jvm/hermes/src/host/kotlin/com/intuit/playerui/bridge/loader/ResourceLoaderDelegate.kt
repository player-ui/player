package com.intuit.playerui.bridge.loader

import com.facebook.soloader.nativeloader.NativeLoaderDelegate
import java.io.InputStream
import kotlin.io.path.createTempFile
import kotlin.io.path.outputStream

/** Simple [NativeLoaderDelegate] for loading a native library packed as resources */
public class ResourceLoaderDelegate : NativeLoaderDelegate {
    private val loaded = mutableListOf<String>()

    override fun loadLibrary(shortName: String, flags: Int): Boolean {
        if (loaded.contains(shortName)) return true

        // Try to find any resources that might match the shortName - this doesn't account for checking platform compatibility, and should only be used to load host-compatible libraries
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
            ?: throw UnsatisfiedLinkError("Unable to load resource for $shortName")

        val rewritten = resource.writeTemp("lib$shortName", ".so")
        System.load(rewritten.toString())

        loaded.add(shortName)

        return true
    }

    override fun getLibraryPath(libName: String?) = null

    override fun getSoSourcesVersion(): Int = 0

    private fun InputStream.writeTemp(prefix: String? = null, suffix: String? = ".so") = use {
        createTempFile(prefix, suffix).apply { outputStream().use(::copyTo) }
    }

    private companion object {
        private val classLoader = ResourceLoaderDelegate::class.java.classLoader

        private fun getResourceAsStream(resourceName: String): InputStream? =
            classLoader.getResourceAsStream(resourceName)?.also { println("found $resourceName") }
    }
}