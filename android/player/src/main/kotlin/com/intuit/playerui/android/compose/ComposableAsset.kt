package com.intuit.playerui.android.compose

import android.view.View
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.FrameLayout
import androidx.compose.foundation.layout.Box
import androidx.compose.material.LocalTextStyle
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.viewinterop.AndroidView
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.GenericAsset
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.asset.asyncHydrationTrackerPlugin
import com.intuit.playerui.android.build
import com.intuit.playerui.android.extensions.Styles
import com.intuit.playerui.android.withContext
import com.intuit.playerui.android.withStyles
import com.intuit.playerui.android.withTag
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.coroutines.CoroutineScope
import kotlinx.serialization.KSerializer

/**
 * Base class for assets that render using Jetpack Compose.
 *
 * @param assetContext The context of the asset.
 * @param serializer The serializer for the Data type.
 */
@ExperimentalPlayerApi
public abstract class ComposableAsset<Data>(
    assetContext: AssetContext,
    serializer: KSerializer<Data>,
) : RenderableAsset<Data>(assetContext, serializer) {
    override suspend fun initView(data: Data): View = ComposeView(requireContext()).apply {
        layoutParams = ViewGroup.LayoutParams(WRAP_CONTENT, WRAP_CONTENT)
    }

    override suspend fun CoroutineScope.hydrate(view: View, data: Data) {
        require(view is ComposeView)
        // Bridge the gap between setContent returning (synchronous) and the composition
        // actually executing (apply phase). Without this extra bump, doRender's finally would
        // decrement the tracker to 0 and fire onHydrationComplete before any nested compose
        // child has had a chance to pre-track itself. The matching decrement fires from a
        // LaunchedEffect inside compose() once first composition completes.
        view.setContent {
            compose(data = data)
        }
    }

    @Composable
    public fun compose(data: Data? = null) {
        val data: Data? by produceState(initialValue = data, key1 = this) {
            value = getData()
        }

        SideEffect {
            player.asyncHydrationTrackerPlugin?.renderingComplete(this@ComposableAsset, completedComposable = true)
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
    public abstract fun content(data: Data)

    /**
     * Extension function to render a [RenderableAsset] within a [ComposableAsset].
     * The new asset can either be a [ComposableAsset] or an Android view.
     *
     * @param modifier The modifier to be applied to the container - a `Box()` for [ComposableAsset]s and an [AndroidView] for android views.
     * @param styles The styles to be applied to the asset. Use the interface [AssetStyle] to define the styles.
     * @param tag The tag to be used to differentiate between the assets with same id. If not provided, the asset ID will be used. Also, defaults as the test tag for the container
     */
    @Composable
    public fun GenericAsset.compose(
        modifier: Modifier = Modifier,
        styles: AssetStyle? = null,
        tag: String? = null,
    ) {
        val assetTag = tag ?: assetContext.asset.id
        val containerModifier = Modifier.testTag(assetTag) then modifier
        assetContext.withContext(LocalContext.current).withTag(assetTag).build().run {
            renewHydrationScope("Creating view within a ComposableAsset")
            player.asyncHydrationTrackerPlugin?.preTrackChild(this)
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

    @Composable
    private fun RenderableAsset<*>.composeAndroidView(modifier: Modifier = Modifier, styles: Styles? = null) {
        val childAsset = this
        AndroidView(factory = ::FrameLayout, modifier) { container ->
            // childAsset was already pre-tracked during composition by the GenericAsset.compose
            // caller; use the already-tracked variant to avoid a double bump.
            this@ComposableAsset.hydrationScope.inflateChildAlreadyTracked(
                childAsset.assetContext.withStyles(styles).build(),
                container,
            )
        }
    }
}

// @Composable
// fun RenderableAsset.compose(
//     modifier: Modifier = Modifier,
//     styles: AssetStyle? = null,
//     tag: String? = null,
// ) {
//     assetContext.withContext(LocalContext.current).withTag(tag ?: asset.id).build().run {
//         when (this) {
//             is ComposableAsset<*> -> CompositionLocalProvider(LocalTextStyle provides (styles?.textStyle ?: TextStyle())) { compose(modifier = modifier) }
//             else -> composeAndroidView(modifier, styles?.xmlStyles)
//         }
//     }
// }
