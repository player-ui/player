package com.intuit.playerui.android.asset

import android.view.View
import android.widget.FrameLayout
import androidx.compose.material.LocalTextStyle
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.viewinterop.AndroidView
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.build
import com.intuit.playerui.android.extensions.Styles
import com.intuit.playerui.android.extensions.into
import com.intuit.playerui.android.withContext
import kotlinx.coroutines.launch
import kotlinx.serialization.KSerializer

/**
 *
 * @param assetContext The context of the asset.
 * @param serializer The serializer for the Data type.
 */
public abstract class ComposableAsset<Data> (
    assetContext: AssetContext,
    serializer: KSerializer<Data>,
) : SuspendableAsset<Data>(assetContext, serializer) {

    override suspend fun initView(data: Data) = ComposeView(requireContext()).apply {
        setContent {
            compose(data)
        }
    }

    override suspend fun View.hydrate(data: Data) {
        require(this is ComposeView)
        setContent {
            compose(data)
        }
    }

    @Composable
    fun compose(data: Data? = null) {
        val dataState = remember { mutableStateOf(data) }
        val coroutineScope = rememberCoroutineScope()

        if (data != null && dataState.value != data) {
            dataState.value = data
        }

        if (data == null) {
            coroutineScope.launch {
                dataState.value = getData()
            }
        }

        dataState.value?.let { content(it) }
    }

    @Composable
    abstract fun content(data: Data)
}

@Composable
fun RenderableAsset.compose(style: Style? = null) {
    when (this) {
        is ComposableAsset<*> -> composeComposableAsset(style?.composeTextStyle)
        else -> composeAndroidView(style?.xmlStyles)
    }
}

@Composable
private fun ComposableAsset<*>.composeComposableAsset(textStyle: TextStyle?) {
    CompositionLocalProvider(
        *listOfNotNull(
            textStyle?.let { LocalTextStyle provides it },
        ).toTypedArray(),
    ) { compose() }
}

@Composable
private fun RenderableAsset.composeAndroidView(styles: Styles?) {
    AndroidView(factory = ::FrameLayout) {
        assetContext.withContext(it.context).build().run {
            styles?.let { styles ->
                render(styles)
            } ?: render()
        } into it
    }
}

data class Style(
    val xmlStyles: Styles? = null,
    val composeTextStyle: TextStyle? = null,
)
