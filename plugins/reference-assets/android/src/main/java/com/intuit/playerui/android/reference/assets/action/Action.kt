package com.intuit.playerui.android.reference.assets.action

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.Button
import androidx.compose.material.ButtonDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.android.compose.compose
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.XmlAssetStyleParser
import com.intuit.playerui.plugins.transactions.commitPendingTransaction
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

class Action(assetContext: AssetContext) : ComposableAsset<Action.Data>(assetContext, Data.serializer()), RenderableAsset.ViewportAsset {

    @Serializable
    data class Data(
        val label: RenderableAsset? = null,
        private val run: () -> Unit,
    ) {
        suspend fun run() = withContext(Dispatchers.Default) {
            run.invoke()
        }
    }

    @Composable
    override fun content(modifier: Modifier, data: Data) {
        Button(
            onClick = {
                hydrationScope.launch {
                    withContext(Dispatchers.Default) {
                        beacon("clicked", "button")
                        player.commitPendingTransaction()
                        data.run()
                    }
                }
            },
            modifier = Modifier.fillMaxWidth().testTag("action"),
            colors = ButtonDefaults.buttonColors(
                backgroundColor = Color.Blue,
            ),

        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement =
                Arrangement.spacedBy(
                    8.dp,
                    Alignment.CenterHorizontally,
                ),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                data.label?.compose(
                    modifier = Modifier.fillMaxWidth(),
                    styles = XmlAssetStyleParser(requireContext()).parse(R.style.Text_Action),
                )
            }
        }
    }
}
