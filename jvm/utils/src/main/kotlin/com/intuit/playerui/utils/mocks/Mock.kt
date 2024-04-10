package com.intuit.playerui.utils.mocks

import com.intuit.playerui.utils.makeFlow
import com.intuit.playerui.utils.stringify

/**
 * Utility interface to standardize how to read "mocks". Simply put, a mock
 * is simply a [String] that can be fed to the player to start a flow.
 * Whether this mock is already quantified as a [String] or needs to be
 * read from some location is up to the implementation.
 */
// TODO: Refactor into [ReadableMock], so that this definition only has a value to get
//  since this Mock doesn't really need to know about any of the group, name, path, stuff.
public interface Mock<T> {
    public val group: String
    public val name: String
    public val path: String

    public val normalizedPath: String get() = path.removePrefix("./")

    /** Read file from [source] as raw [String] */
    public fun read(source: T): String
}

/** Helper to build a valid flow using [makeFlow] and [stringify] */
public fun <T> Mock<T>.getFlow(source: T): String = makeFlow(read(source)).stringify()
