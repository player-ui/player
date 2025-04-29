package com.intuit.playerui.android.compose

import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.FrameLayout
import androidx.compose.material.LocalTextStyle
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ProvidedValue
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.viewinterop.AndroidView
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.DecodableAsset
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.build
import com.intuit.playerui.android.extensions.Styles
import com.intuit.playerui.android.extensions.into
import com.intuit.playerui.android.withContext
import com.intuit.playerui.android.withTag
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.coroutines.launch
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
) : DecodableAsset<Data>(assetContext, serializer) {

    override suspend fun initView(data: Data) = ComposeView(requireContext()).apply {
        layoutParams = if (asset is ViewportAsset) {
            ViewGroup.LayoutParams(MATCH_PARENT, MATCH_PARENT)
        } else {
            ViewGroup.LayoutParams(WRAP_CONTENT, WRAP_CONTENT)
        }
    }

    override suspend fun View.hydrate(data: Data) {
        require(this is ComposeView)
        setContent {
            compose(data = data)
        }
    }

    fun updateProvidedValues(values: List<ProvidedValue<*>>) {
        // Update the internal state or perform actions with the new values
        player.providedValues.addAll(values)
    }

    @Composable
    fun compose(modifier: Modifier? = Modifier, data: Data? = null) {
        val data: Data? by produceState<Data?>(initialValue = data, key1 = this) {
            value = getData()
        }

        data?.let {
            // Getting the local values provided by the plugin hook
            player.hooks.compositionLocalProvidedValues.call(hashMapOf(), ::updateProvidedValues)
            CompositionLocalProvider(*(player.providedValues).toTypedArray()) {
                content(modifier ?: Modifier, it)
            }
        }
    }

    @Composable
    abstract fun content(modifier: Modifier, data: Data)

    @Composable
    private fun RenderableAsset.composeAndroidView(
        modifier: Modifier = Modifier,
        styles: Styles? = null,
    ) {
        AndroidView(factory = ::FrameLayout, modifier) {
            hydrationScope.launch {
                render(styles) into it
            }
        }
    }

    @Composable
    fun RenderableAsset.compose(
        modifier: Modifier = Modifier,
        styles: AssetStyle? = null,
        tag: String? = null,
    ) {
        val assetTag = tag ?: asset.id
        assetContext.withContext(LocalContext.current).withTag(assetTag).build().run {
            renewHydrationScope("Creating view within a ComposableAsset")
            when (this) {
                is ComposableAsset<*> -> CompositionLocalProvider(
                    LocalTextStyle provides (styles?.textStyle ?: TextStyle()),
                ) {
                    compose(modifier = Modifier.testTag(assetTag) then modifier)
                }
                else -> composeAndroidView(modifier, styles?.xmlStyles)
            }
        }
    }
}
