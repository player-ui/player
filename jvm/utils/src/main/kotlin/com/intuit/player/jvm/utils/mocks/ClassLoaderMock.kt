package com.intuit.player.jvm.utils.mocks

import kotlinx.serialization.Serializable

@Serializable
public data class ClassLoaderMock(
    override val group: String,
    override val name: String,
    override val path: String
) : Mock<ClassLoader> {

    /** Helper to provide default [ClassLoader] overload of [read] */
    public fun read(): String = read(ClassLoader.getSystemClassLoader())

    override fun read(source: ClassLoader): String = source
        .getResource(normalizedPath)!!
        .readText()

    // TODO: Eventually, this should return an actual [Flow]
    /** Helper to provide default [ClassLoader] overload of [getFlow] */
    public fun getFlow(): String = getFlow(ClassLoader.getSystemClassLoader())
}
