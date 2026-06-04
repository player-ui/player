package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.Slider
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

/** A2UI `Slider` — a numeric range input bound to the data model. */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UISlider(
    assetContext: AssetContext,
) : ComposableAsset<A2UISlider.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val currentValue: Double = 0.0,
        val minValue: Double = 0.0,
        val maxValue: Double = 100.0,
        override val accessibility: String? = null,
        override val weight: Double? = null,
        private val set: (Double) -> Unit = {},
    ) : A2UICommon {
        suspend fun set(value: Double) = withContext(Dispatchers.Default) { set.invoke(value) }
    }

    @Composable
    override fun content(data: Data) {
        val scope = rememberCoroutineScope()
        Column(modifier = Modifier.fillMaxWidth().a2uiCommon(data)) {
            Slider(
                value = data.currentValue.toFloat(),
                onValueChange = { value -> scope.launch { data.set(value.toDouble()) } },
                valueRange = data.minValue.toFloat()..data.maxValue.toFloat(),
            )
            Text(text = data.currentValue.toString())
        }
    }
}
