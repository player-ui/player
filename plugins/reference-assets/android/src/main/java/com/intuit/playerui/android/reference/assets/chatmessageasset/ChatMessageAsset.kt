import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.asset.SuspendableAsset
import com.intuit.playerui.android.reference.assets.R
import kotlinx.serialization.Serializable

//public interface AsyncUpdatable {
//    public suspend fun updateAsyncContent(newData: List<ChatMessageAsset.Data>)
//}

public open class ChatMessageAsset(assetContext: AssetContext) : SuspendableAsset<ChatMessageAsset.Data>(assetContext, Data.serializer()) {

    @Serializable
    public data class Data(
        val message: String,
        val followUp: List<RenderableAsset>? = null,
        val async: Boolean = false
    )

    private var currentView: LinearLayout? = null

    override suspend fun initView(data: Data): LinearLayout {
        print("initView")
        return LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(TextView(context).apply {
                id = R.id.message_text
                text = data.message
            })
        }.also {
            currentView = it
        }
    }

    override suspend fun View.hydrate(data: Data) {
        if (this is LinearLayout) {
            data.followUp?.let { followUpAssets ->
                followUpAssets.forEach { asset ->
                    addView(asset.render())
                }
            }
        }
    }

//    override suspend fun updateAsyncContent(newData: List<Data>) {
//        val view = currentView ?: return
//        newData.forEach { data ->
//            view.hydrate(data)
//        }
//    }
}
