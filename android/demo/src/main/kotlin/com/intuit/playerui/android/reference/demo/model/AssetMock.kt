package com.intuit.playerui.android.reference.demo.model

import android.content.res.AssetManager
import com.intuit.playerui.utils.mocks.Mock

open class AssetMock(
    override val group: String,
    override val name: String,
    override val path: String,
) : Mock<AssetManager> {
    override fun read(source: AssetManager) = source
        .open(normalizedPath)
        .bufferedReader()
        .use { it.readText() }
}
