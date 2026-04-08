package com.intuit.playerui.android.utils

import android.content.Context
import android.view.View
import android.widget.TextView
import androidx.compose.foundation.layout.Box
import androidx.compose.material.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.R
import com.intuit.playerui.android.asset.DecodableAsset
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.AssetStyle
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.android.extensions.Style
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.runtime.runtimeFactory
import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializer
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.utils.InternalPlayerApi
import com.intuit.playerui.utils.makeFlow
import kotlinx.serialization.json.Json

@OptIn(ExperimentalPlayerApi::class)
internal class SimpleComposableAsset(
    assetContext: AssetContext,
) : ComposableAsset<Node>(assetContext, NodeSerializer()) {
    @Composable
    override fun content(data: Node) {
        Text(
            text = data.getString("label") ?: "simple-compose",
            modifier = Modifier.testTag("simple-compose"),
        )
    }

    companion object {
        private val runtime = runtimeFactory.create()
        private val sampleMap = mapOf(
            "id" to "simple-compose-asset",
            "type" to "simple-compose",
            "label" to "Hello Compose",
            "metaData" to mapOf<String, Any>("a" to "b"),
        )
        val sampleAsset = runtime.serialize(sampleMap) as Asset
        val sampleFlow = makeFlow(Json.encodeToJsonElement(GenericSerializer(), sampleMap))
    }
}

@Suppress("DEPRECATION_ERROR")
@OptIn(ExperimentalPlayerApi::class)
internal class NestedComposableAsset(
    assetContext: AssetContext,
) : ComposableAsset<Node>(assetContext, NodeSerializer()) {
    val nested: RenderableAsset? = expand("nested")

    @Composable
    override fun content(data: Node) {
        Box(modifier = Modifier.testTag("nested-compose")) {
            Text(
                text = data.getString("label") ?: "parent",
                modifier = Modifier.testTag("nested-compose-label"),
            )
            nested?.compose(tag = "child-tag")
        }
    }

    companion object {
        val sampleFlow = makeFlow(
            Json.encodeToJsonElement(
                GenericSerializer(),
                mapOf(
                    "id" to "nested-compose-id",
                    "type" to "nested-compose",
                    "label" to "Parent",
                    "metaData" to mapOf<String, Any>("a" to "b"),
                    "nested" to mapOf(
                        "asset" to mapOf(
                            "id" to "child-compose-id",
                            "type" to "simple-compose",
                            "label" to "Child",
                            "metaData" to mapOf<String, Any>("a" to "b"),
                        ),
                    ),
                ),
            ),
        )
    }
}

/**
 * A ComposableAsset that captures the [LocalTextStyle] value from its composition.
 * Used to test textStyle propagation through the Compose layer.
 */
@OptIn(ExperimentalPlayerApi::class)
internal class TextStyleCapturingAsset(
    assetContext: AssetContext,
) : ComposableAsset<Node>(assetContext, NodeSerializer()) {
    @Composable
    override fun content(data: Node) {
        lastCapturedTextStyle = androidx.compose.material.LocalTextStyle.current
        Text(text = "capturing", modifier = Modifier.testTag("text-style-capturing"))
    }

    companion object {
        var lastCapturedTextStyle: TextStyle? = null

        fun reset() {
            lastCapturedTextStyle = null
        }
    }
}

/**
 * View-based asset that captures its context in a static companion
 * so tests can assert the context was styled correctly.
 */
@Suppress("DEPRECATION_ERROR")
internal class ContextCapturingAsset(
    assetContext: AssetContext,
) : DecodableAsset<Node>(assetContext, Node.serializer()) {
    override fun initView(): View {
        lastCapturedContext = context
        return TextView(context)
    }

    override fun View.hydrate() = Unit

    companion object {
        var lastCapturedContext: Context? = null

        fun reset() {
            lastCapturedContext = null
        }
    }
}

/**
 * A ComposableAsset that passes [AssetStyle] with xmlStyles to its nested child.
 * Used to test style propagation through the Compose layer.
 */
@Suppress("DEPRECATION_ERROR")
@OptIn(ExperimentalPlayerApi::class)
internal class StyledNestedComposableAsset(
    assetContext: AssetContext,
) : ComposableAsset<Node>(assetContext, NodeSerializer()) {
    val nested: RenderableAsset? = expand("nested")

    private val styles = object : AssetStyle {
        override val textStyle: TextStyle = TextStyle(fontSize = 24.sp)
        override val xmlStyles: List<Style> = listOf(R.style.Theme_AppCompat)
    }

    @Composable
    override fun content(data: Node) {
        Box(modifier = Modifier.testTag("styled-nested-compose")) {
            nested?.compose(styles = styles, tag = "styled-child-tag")
        }
    }

    companion object {
        /** Compose (styled) → Compose chain for textStyle propagation. */
        val styledComposeChildFlow = makeFlow(
            Json.encodeToJsonElement(
                GenericSerializer(),
                mapOf(
                    "id" to "styled-text-parent-id",
                    "type" to "styled-nested-compose",
                    "label" to "StyledTextParent",
                    "metaData" to mapOf<String, Any>("a" to "b"),
                    "nested" to mapOf(
                        "asset" to mapOf(
                            "id" to "text-style-child-id",
                            "type" to "text-style-capturing",
                            "metaData" to mapOf<String, Any>("a" to "b"),
                        ),
                    ),
                ),
            ),
        )

        /** Compose (styled) → XML view chain — tests withStyles propagation. */
        @OptIn(InternalPlayerApi::class)
        val styledComposeToViewFlow = makeFlow(
            Json.encodeToJsonElement(
                GenericSerializer(),
                mapOf(
                    "id" to "styled-outer-id",
                    "type" to "styled-nested-compose",
                    "label" to "StyledOuter",
                    "metaData" to mapOf<String, Any>("a" to "b"),
                    "nested" to mapOf(
                        "asset" to mapOf(
                            "id" to "leaf-view-id",
                            "type" to "context-capturing",
                            "metaData" to mapOf<String, Any>("a" to "b"),
                        ),
                    ),
                ),
            ),
        )
    }
}
