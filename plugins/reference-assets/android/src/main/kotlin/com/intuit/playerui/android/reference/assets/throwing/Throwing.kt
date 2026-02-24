package com.intuit.playerui.android.reference.assets.throwing

import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.serializer

/** Timing for the throwing asset to throw. Excludes 'render' to force deserialization error for that case. */
enum class ThrowTiming(val value: String) {
    /** throw an error during the afterResolve transform */
    Transform("transform")
}

class Throwing(
    assetContext: AssetContext,
) : ComposableAsset<Throwing.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val value: String?,
        val timing: ThrowTiming,
    )

    @Composable
    override fun content(data: Data) {
        if (data.timing != ThrowTiming.Transform) {
            throw Error("Throwing asset is throwing at render time")
        }

        Text(data.value ?: "Nothing to see here")
    }
}
