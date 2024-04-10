package com.intuit.playerui.android.reference.assets.action

import android.view.View
import android.widget.Button
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.SuspendableAsset
import com.intuit.playerui.android.reference.assets.text.Text
import com.intuit.playerui.plugins.transactions.commitPendingTransaction
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable

class Action(assetContext: AssetContext) : SuspendableAsset<Action.Data>(assetContext, Data.serializer()) {

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
        private val run: () -> Unit,
    ) {
        suspend fun run() = withContext(Dispatchers.Default) {
            run.invoke()
        }
    }

    override suspend fun initView(data: Data) = Button(context)

    override suspend fun View.hydrate(data: Data) {
        require(this is Button)

        data.label?.let {
            text = it.getData().value
        }

        setOnClickListener {
            beacon("clicked", "button")
            player.commitPendingTransaction()
            hydrationScope.launch {
                data.run()
            }
        }
    }
}
