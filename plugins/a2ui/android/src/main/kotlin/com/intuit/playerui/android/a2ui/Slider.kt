package com.intuit.playerui.android.a2ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.Slider as ComposeSlider
import androidx.compose.material.Text as ComposeText
import androidx.compose.material.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

/** Numeric range input bound to the data model. */
public class Slider(
    assetContext: AssetContext,
) : ComposableAsset<Slider.Data>(assetContext, Data.serializer()) {
    @Serializable
    public data class Data(
        val currentValue: Double = 0.0,
        val minValue: Double = 0.0,
        val maxValue: Double = 100.0,
        private val set: (Double) -> Unit,
    ) {
        suspend fun set(newValue: Double): Unit = withContext(Dispatchers.Default) { set.invoke(newValue) }
    }

    @Composable
    override fun content(data: Data) {
        val scope = rememberCoroutineScope()
        Column(modifier = Modifier.fillMaxWidth().testTag("Slider")) {
            ComposeSlider(
                value = data.currentValue.toFloat(),
                onValueChange = { next -> scope.launch { data.set(next.toDouble()) } },
                valueRange = data.minValue.toFloat()..data.maxValue.toFloat(),
            )
            ComposeText(
                text = data.currentValue.toString(),
                style = MaterialTheme.typography.caption,
            )
        }
    }
}
