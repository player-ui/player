package com.intuit.player.android.reference.demo.model

import android.content.res.AssetManager
import com.intuit.player.jvm.utils.mocks.Mock

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
