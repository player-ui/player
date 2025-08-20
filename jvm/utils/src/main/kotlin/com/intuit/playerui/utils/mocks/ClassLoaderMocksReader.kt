package com.intuit.playerui.utils.mocks

import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json

/** Utility class to catalogue the published mocks bundled in a player plugin mocks package */
public class ClassLoaderMocksReader(
    private val classLoader: ClassLoader = ClassLoader.getSystemClassLoader(),
    private val manifestPath: String = "mocks/manifest.json",
) {
    /**
     * Manifest is a JSON blob published by the player plugin mocks package declaring
     * the names, groupings, and paths for each of the bundled mocks. This property
     * will read the manifest on demand and default to an empty list if not found.
     */
    public val manifest: String by lazy {
        classLoader.getResource(manifestPath)?.readText() ?: "[]"
    }

    /**
     * Deserialized representation of the manifest, allowing for easier usage of
     * the catalogued mocks.
     */
    public val mocks: List<ClassLoaderMock> by lazy {
        Json.decodeFromString(ListSerializer(ClassLoaderMock.serializer()), manifest)
    }

    /** Helper to find a mock with [name] */
    public fun findMockByName(name: String): ClassLoaderMock? = mocks.find {
        name == it.name
    }
}
