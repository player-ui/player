package com.intuit.playerui.android.compose

import android.view.View
import android.widget.FrameLayout
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.viewinterop.AndroidView
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.asset.SuspendableAsset
import com.intuit.playerui.android.build
import com.intuit.playerui.android.extensions.Styles
import com.intuit.playerui.android.extensions.into
import com.intuit.playerui.android.withContext
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.KSerializer

/**
 * Base class for assets that render using Jetpack Compose.
 *
 * @param assetContext The context of the asset.
 * @param serializer The serializer for the Data type.
 */
@ExperimentalPlayerApi
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
        val data: Data? by produceState<Data?>(initialValue = data, key1 = this) {
            value = getData()
        }

        data?.let { content(it) }
    }

    @Composable
    abstract fun content(data: Data)
}

// TODO: What kind of logging do we want?
@Composable
fun RenderableAsset.compose(androidViewAttributes: AndroidViewAttributes? = null) {
    when (this) {
        is ComposableAsset<*> -> compose()
        else -> composeAndroidView(androidViewAttributes)
    }
}

@Composable
private fun RenderableAsset.composeAndroidView(androidViewAttributes: AndroidViewAttributes? = null) {
    val modifier = androidViewAttributes?.modifier ?: Modifier
    val styles = androidViewAttributes?.styles
    AndroidView(factory = ::FrameLayout, modifier) {
        assetContext.withContext(it.context).build().run {
            styles?.let { styles ->
                render(styles)
            } ?: render()
        } into it
    }
}

data class AndroidViewAttributes(
    val modifier: Modifier = Modifier,
    val styles: Styles? = null,
)
