package com.intuit.playerui.android.compose

import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.FrameLayout
import androidx.compose.foundation.layout.Box
import androidx.compose.material.LocalTextStyle
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
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
import kotlinx.coroutines.Dispatchers
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
       layoutParams = ViewGroup.LayoutParams(WRAP_CONTENT, WRAP_CONTENT)
       setContent {
            compose(data = data)
        }
    }

    override suspend fun View.hydrate(data: Data) {
        require(this is ComposeView)
        setContent {
            compose(data = data)
        }
    }

    @Composable
    fun compose(data: Data? = null) {
        val data: Data? by produceState(initialValue = data, key1 = this) {
            value = getData()
        }

        data?.let {
            // Getting the local values provided by the plugin hook
            player.hooks.compositionLocalProvidedValues.call(hashMapOf(), player::updateProvidedValues)
            CompositionLocalProvider(*(player.providedValues).toTypedArray()) {
                content(it)
            }
        }
    }

    @Composable
    abstract fun content(data: Data)

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

    /**
    * Extension function to render a [RenderableAsset] within a [ComposableAsset].
    * The new asset can either be a [ComposableAsset] or an Android view.
    *
    * @param modifier The modifier to be applied to the container - a `Box()` for [ComposableAsset]s and an [AndroidView] for android views.
    * @param styles The styles to be applied to the asset. Use the interface [AssetStyle] to define the styles.
    * @param tag The tag to be used to differentiate between the assets with same id. If not provided, the asset ID will be used. Also, defaults as the test tag for the container
    */
    @Composable
    fun RenderableAsset.compose(
        modifier: Modifier = Modifier,
        styles: AssetStyle? = null,
        tag: String? = null,
    ) {
        val assetTag = tag ?: asset.id
        val containerModifier = Modifier.testTag(assetTag) then modifier
        assetContext.withContext(LocalContext.current).withTag(assetTag).build().run {
            renewHydrationScope("Creating view within a ComposableAsset")
            when (this) {
                is ComposableAsset<*> -> CompositionLocalProvider(
                    LocalTextStyle provides (styles?.textStyle ?: TextStyle()),
                ) {
                    Box(containerModifier) {
                        compose()
                    }
                }
                else -> composeAndroidView(containerModifier, styles?.xmlStyles)
            }
        }
    }
}
  