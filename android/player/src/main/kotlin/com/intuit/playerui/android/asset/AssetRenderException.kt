package com.intuit.playerui.android.asset

import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.core.player.PlayerException

class AssetRenderException : PlayerException {

    private var _assetParentPath: List<AssetContext> = emptyList()
    var assetParentPath: List<AssetContext>
        get() = _assetParentPath
        set(newList) {
            _assetParentPath = newList
            val pathString = newList.joinToString { c ->
                "\n\tFound in (id: '${c.id}', type: '${c.type}')"
            }
            message = initialMessage + pathString
        }

    val rootAsset: AssetContext
    val initialMessage: String
    override var message: String = ""

    internal constructor(rootAsset: AssetContext, message: String, exception: Throwable? = null) : super(message, exception) {
        val errorMessage = if (exception == null) {
            message
        } else {
            """$message
Caused by: ${exception.message}
            """.trimMargin()
        }
        initialMessage = "$errorMessage\nException occurred in asset with id '${rootAsset.id}' of type '${rootAsset.type}"
        this.rootAsset = rootAsset
    }
}
