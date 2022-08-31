package com.intuit.player.android.reference.assets.test

import android.content.Context
import android.view.View
import androidx.test.core.app.ApplicationProvider
import androidx.test.runner.AndroidJUnit4
import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.android.reference.assets.ReferenceAssetsPlugin
import com.intuit.player.jvm.core.player.state.PlayerFlowState
import com.intuit.player.jvm.core.plugins.Plugin
import com.intuit.player.jvm.utils.makeFlow
import com.intuit.player.jvm.utils.mocks.ClassLoaderMock
import com.intuit.player.jvm.utils.mocks.ClassLoaderMocksReader
import com.intuit.player.jvm.utils.mocks.Mock
import com.intuit.player.jvm.utils.mocks.getFlow
import com.intuit.player.jvm.utils.start
import com.intuit.player.plugins.transactions.PendingTransactionPlugin
import com.intuit.player.plugins.types.CommonTypesPlugin
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import org.junit.Before
import org.junit.Rule
import org.junit.rules.TestName
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
abstract class AssetTest(val group: String? = null) {

    @get:Rule
    val name = TestName()

    open val plugins: List<Plugin> by lazy { listOf(ReferenceAssetsPlugin(), CommonTypesPlugin(), PendingTransactionPlugin()) }

    val context: Context get() = ApplicationProvider.getApplicationContext()

    val player by lazy {
        AndroidPlayer(plugins)
    }

    var currentAssetTree: RenderableAsset? = null
        private set(value) {
            field = value
            currentView = field?.render(context)
        }

    var currentView: View? = null
        private set

    protected val currentState: PlayerFlowState get() = player.state

    protected val mocks get() = ClassLoaderMocksReader(context.classLoader).mocks.filter {
        group == null || group == it.group
    }

    @Before
    fun beforeEach() {
        player.onUpdate { asset, _ -> currentAssetTree = asset }
    }

    fun launchMock() = launchMock(name.methodName)

    fun launchMock(name: String) = launchMock(
        mocks.find { it.name == name || it.name == "$group-$name" }
            ?: throw IllegalArgumentException("$name not found in mocks: ${mocks.map { "${it.group}/${it.name}" }}")
    )

    fun launchMock(mock: Mock<*>) = launchJson(
        when (mock) {
            is ClassLoaderMock -> mock.getFlow(context.classLoader)
            else -> throw IllegalArgumentException("mock of type ${mock::class.java.simpleName} not supported")
        }
    )

    fun launchJson(json: JsonElement) = launchJson(Json.encodeToString(json))

    fun launchJson(json: String) = player.start(makeFlow(json)).onComplete {
        it.exceptionOrNull()?.printStackTrace()
    }
}
