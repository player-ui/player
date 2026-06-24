package com.intuit.playerui.android.asset

import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.core.bridge.serialization.serializers.ThrowableSerializer
import com.intuit.playerui.core.error.ErrorSeverity
import com.intuit.playerui.core.error.ErrorTypes
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.player.PlayerExceptionMetadata
import kotlinx.serialization.Serializable

@Serializable(ThrowableSerializer::class)
class AssetRenderException :
    PlayerException,
    PlayerExceptionMetadata {
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

    override val type: String = ErrorTypes.RENDER.value
    override val severity: ErrorSeverity = ErrorSeverity.ERROR
    override val metadata: Map<String, Any?>

    internal constructor(rootAsset: AssetContext, message: String, exception: Throwable? = null) : super(message, exception) {
        val errorMessage = if (exception == null) {
            message
        } else {
            """$message
Caused by: ${exception.message}
            """.trimMargin()
        }
        initialMessage = "$errorMessage\nException occurred in asset with id '${rootAsset.id}' of type '${rootAsset.type}"
        this.message = initialMessage
        this.rootAsset = rootAsset
        this.metadata = mapOf(
            "assetId" to this.rootAsset.asset.id,
        )
    }
}
