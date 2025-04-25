package com.intuit.playerui.android.reference.assets.text

import android.text.method.LinkMovementMethod
import android.text.style.ClickableSpan
import android.view.View
import android.widget.TextView
import androidx.annotation.StyleRes
import androidx.core.text.buildSpannedString
import androidx.core.text.inSpans
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.DecodableAsset
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.ReferenceAssetsPlugin.Companion.referenceAssetsPlugin
import com.intuit.playerui.core.player.Player
import kotlinx.serialization.Serializable

class Text(assetContext: AssetContext) : DecodableAsset<Text.Data>(assetContext, Data.serializer()) {

    object Styles {
        @StyleRes val Default = R.style.Text

        @StyleRes val Title = R.style.Text_Title

        @StyleRes val Label = R.style.Text_Label

        @StyleRes val Note = R.style.Text_Note
    }

    @Serializable
    data class Data(
        val value: String?,
        private val modifiers: List<Modifier> = emptyList(),
    ) {
        @Serializable data class Modifier(
            val type: String,
            // TODO: LinkMetaData isn't relevant to all modifiers
            //       but we don't care about other modifiers, it'd
            //       be nice to have a way to _only_ decode a LinkModifier
            //       if it _is_ a LinkModifier, and not error out
            //       on unknown modifiers that we don't care about
            val metaData: LinkMetaData? = null,
        ) {
            @Serializable data class LinkMetaData(
                val ref: String,
            )
        }

        val ref: String? get() = modifiers.firstOrNull {
            it.type == "link"
        }?.metaData?.ref
    }

    override suspend fun initView(data: Data) = TextView(context).apply {
        data.ref?.let {
            movementMethod = LinkMovementMethod.getInstance()
        }
    }

    override suspend fun View.hydrate(data: Data) {
        when (this) {
            is TextView -> text = buildSpannedString {
                data.ref?.let {
                    inSpans(refSpan(it)) { append(data.value) }
                } ?: append(data.value)
            }
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
