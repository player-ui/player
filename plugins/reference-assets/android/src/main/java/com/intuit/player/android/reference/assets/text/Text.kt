package com.intuit.player.android.reference.assets.text

import android.text.method.LinkMovementMethod
import android.text.style.ClickableSpan
import android.view.View
import android.widget.TextView
import androidx.annotation.StyleRes
import androidx.core.text.buildSpannedString
import androidx.core.text.inSpans
import com.intuit.player.android.AssetContext
import com.intuit.player.android.asset.DecodableAsset
import com.intuit.player.android.reference.assets.R
import com.intuit.player.android.reference.assets.ReferenceAssetsPlugin.Companion.referenceAssetsPlugin
import com.intuit.player.jvm.core.bridge.Node
import com.intuit.player.jvm.core.player.Player
import kotlinx.serialization.Serializable

class Text(assetContext: AssetContext) : DecodableAsset<Text.Data>(assetContext, Data.serializer()) {

    object Styles {
        @StyleRes val Default = R.style.Text
        @StyleRes val Title = R.style.Text_Title
        @StyleRes val Label = R.style.Text_Label
    }

    @Serializable
    data class Data(
        val value: String?,
        val modifiers: List<Node> = emptyList()
    ) {
        val ref: String? = modifiers.firstOrNull {
            it["type"] == "link"
        }?.getObject("metaData")?.getString("ref")
    }

    val text get() = buildSpannedString {
        data.ref?.let {
            inSpans(refSpan(it)) { append(data.value) }
        } ?: append(data.value)
    }

    override fun initView() = TextView(context).apply {
        data.ref?.let {
            movementMethod = LinkMovementMethod.getInstance()
        }
    }

    override fun View.hydrate() {
        when (this) {
            is TextView -> text = this@Text.text
            else -> invalidateView()
        }
    }

    private fun refSpan(ref: String) = RefSpan(player, ref)

    class RefSpan(val player: Player, val ref: String) : ClickableSpan() {
        override fun onClick(widget: View) {
            player.referenceAssetsPlugin.handleLink(ref, widget.context)
        }
    }
}
