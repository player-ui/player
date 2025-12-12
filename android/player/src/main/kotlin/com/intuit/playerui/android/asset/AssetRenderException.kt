package com.intuit.playerui.android.asset

import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.core.player.PlayerException

class AssetRenderException : PlayerException {
    private val assetParentPath = mutableListOf<AssetContext>()

    val rootAsset: AssetContext
    override var message: String = ""
    val initialMessage: String

    constructor(rootAsset: AssetContext, message: String, exception: Throwable? = null) : super(message, exception) {
        initialMessage = if (exception == null) {
            message
        } else {
            """$message
Caused by: ${exception.message}
            """.trimMargin()
        }
        this.rootAsset = rootAsset
        updateMessage()
    }

    fun addAssetParent(asset: AssetContext) {
        assetParentPath.add(asset)
        updateMessage()
    }

    fun getAssetPathMessage(): String =
        "Exception occurred in asset with id '${rootAsset.id}' of type '${rootAsset.type}'${assetParentPath.joinToString { c ->
            "\n\tFound in (id: '${c.id}', type: '${c.type}')"
        }}"

    private fun updateMessage() {
        message = """$initialMessage
${getAssetPathMessage()}
        """.trimMargin()
    }
}
