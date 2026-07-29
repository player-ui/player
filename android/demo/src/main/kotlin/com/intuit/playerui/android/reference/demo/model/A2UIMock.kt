package com.intuit.playerui.android.reference.demo.model

import com.intuit.playerui.utils.mocks.Mock

/**
 * A mock backed by the canonical A2UI snapshot catalog (`//plugins/a2ui/mocks:jar`,
 * read from `a2ui/mocks/manifest.json`). Distinct type from [AssetMock] so the demo
 * knows to start these snapshots with the `"a2ui"` content format rather than treating
 * them as Player flows.
 */
class A2UIMock(
    override val group: String,
    override val name: String,
    override val path: String,
) : Mock<ClassLoader> {
    override fun read(source: ClassLoader): String = source
        .getResource(normalizedPath)!!
        .readText()

    fun getFlow(classLoader: ClassLoader): String = read(classLoader)
}
