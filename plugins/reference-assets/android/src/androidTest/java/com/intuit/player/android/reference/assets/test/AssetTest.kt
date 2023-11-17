package com.intuit.player.android.reference.assets.test

import android.content.Context
import android.os.Build.VERSION_CODES.P
import android.view.View
import android.view.ViewGroup
import androidx.core.view.children
import androidx.test.core.app.ApplicationProvider
import androidx.test.runner.AndroidJUnit4
import com.intuit.player.android.AndroidPlayer
import com.intuit.player.android.R
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.android.asset.SuspendableAsset
import com.intuit.player.android.reference.assets.ReferenceAssetsPlugin
import com.intuit.player.jvm.core.player.state.InProgressState
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
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import org.junit.Before
import org.junit.Rule
import org.junit.rules.TestName
import org.junit.runner.RunWith
import org.robolectric.annotation.Config

@RunWith(AndroidJUnit4::class)
@Config(sdk = [P])
@OptIn(ExperimentalCoroutinesApi::class)
abstract class AssetTest(val group: String? = null) {

    @get:Rule
    val name = TestName()

    open val plugins: List<Plugin> by lazy { listOf(ReferenceAssetsPlugin(), CommonTypesPlugin(), PendingTransactionPlugin()) }

    val context: Context get() = ApplicationProvider.getApplicationContext()

    val player by lazy {
        AndroidPlayer(plugins)
    }

    /** Flow that captures the latest view update - should be cleared once it is consumed */
    private var viewChannel = MutableSharedFlow<View>(replay = 1)

    /** Awaits [View] to be published to [viewChannel] and clears the replay cache to ensure we can wait for a new one */
    private suspend fun consumeLatestView(timeout: Long = 5_000): View = try {
        withTimeout(timeout) {
            viewChannel.first().apply {
                awaitCompleteHydration()
                currentView = takeIf { it != emptyView }
                viewChannel.resetReplayCache()
            }
        }
    } catch (exception: CancellationException) {
        throw AssertionError("Expected view to update, but it did not.", exception)
    }

    var currentAssetTree: RenderableAsset? = null; private set(value) {
        // reset view on new asset
        currentView = null

        field = value

        field?.let {
            when (val view = it.render(context)) {
                is SuspendableAsset.AsyncViewStub -> view.onView(viewChannel::tryEmit)
                else -> viewChannel.tryEmit(view)
            }
        }
    }

    var currentView: View? = null; get() = field ?: blockUntilRendered()
        set(value) {
            field = value.also {
                // reset replay cache to clear value if the current value is set to null
                it ?: viewChannel.resetReplayCache()
            }
        }

    protected val currentState: PlayerFlowState get() = player.state

    protected val mocks get() = ClassLoaderMocksReader(context.classLoader).mocks.filter {
        group == null || group == it.group
    }

    private val emptyView = View(context)

    @Before
    fun beforeEach() {
        player.onUpdate { asset, _ -> currentAssetTree = asset }
        player.hooks.state.tap { state ->
            if (state !is InProgressState) {
                // update the channel with an empty view to satisfy consumeLatestView condition
                viewChannel.tryEmit(emptyView)
            }
        }
    }

    fun launchMock() = launchMock(name.methodName)

    fun launchMock(name: String) = launchMock(
        mocks.find { it.name == name || it.name == "$group-$name" }
            ?: throw IllegalArgumentException("$name not found in mocks: ${mocks.map { "${it.group}/${it.name}" }}"),
    )

    fun launchMock(mock: Mock<*>) = launchJson(
        when (mock) {
            is ClassLoaderMock -> mock.getFlow(context.classLoader)
            else -> throw IllegalArgumentException("mock of type ${mock::class.java.simpleName} not supported")
        },
    )

    fun launchJson(json: JsonElement) = launchJson(Json.encodeToString(json))

    fun launchJson(json: String) = player.start(makeFlow(json)).onComplete {
        it.exceptionOrNull()?.printStackTrace()
    }

    /** Suspend until we have a [View] representation of [currentAssetTree] that is _completely_ hydrated */
    suspend fun awaitRendered(timeout: Long = 5_000): View = consumeLatestView(timeout)

    fun blockUntilRendered(timeout: Long = 5_000) = runBlocking {
        awaitRendered(timeout)
    }

    /** Naive helper for suspending until hydration is complete, resolves async view stubs and recursively awaits all children for hydration */
    private suspend fun View.awaitCompleteHydration() {
        if (this is SuspendableAsset.AsyncViewStub) { awaitView()?.awaitCompleteHydration(); return }

        while (getTag(R.bool.view_hydrated) == false) delay(25)

        if (this is ViewGroup) children.forEach { it.awaitCompleteHydration() }
    }
}
