package com.intuit.player.android.reference.assets.action

import android.view.View
import android.widget.Button
import com.intuit.player.android.AssetContext
import com.intuit.player.android.asset.DecodableAsset
import com.intuit.player.android.reference.assets.text.Text
import com.intuit.player.plugins.transactions.commitPendingTransaction
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable

class Action(assetContext: AssetContext) : DecodableAsset<Action.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Data(
        /**
         * Note: Defining concrete RenderableAsset implementations is **not** recommended.
         * However, sometimes there are constraints that require certain asset slots to
         * follow a certain representation. For example, the Android Button requires some
         * text representation for the label. With this limited asset set, we can assert
         * that the label is an instance of the Text asset so that we can get the underlying
         * value of the asset.
         *
         * To that effect, deserializing into a concrete RenderableAsset implementation
         * requires some overhead to discourage such uses. You must either add the
         * ```
         * @Serializable(ContextualSerializer::class)
         * ```
         * annotation to the concrete implementation class or add `@Contextual` to the
         * actual value to ensure that the value is deserialized using a contextual
         * serializer.
         */
        val label: @Contextual Text? = null,
        val run: () -> Unit,
    )

    override fun initView() = Button(context)

    override fun View.hydrate() {
        require(this is Button)

        data.label?.let {
            text = it.data.value
        }

        setOnClickListener {
            beacon("clicked", "button")
            player.commitPendingTransaction()
            data.run()
        }
    }
}
