package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.material.Divider
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.Serializable

/** A2UI `Divider` — a horizontal or vertical separator line. */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UIDivider(
    assetContext: AssetContext,
) : ComposableAsset<A2UIDivider.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val axis: String? = null,
        override val accessibility: String? = null,
        override val weight: Double? = null,
    ) : A2UICommon

    @Composable
    override fun content(data: Data) {
        if (data.axis == "vertical") {
            Divider(modifier = Modifier.fillMaxHeight().width(1.dp).a2uiCommon(data))
        } else {
            Divider(modifier = Modifier.fillMaxWidth().a2uiCommon(data))
        }
    }
}
