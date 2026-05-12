package com.intuit.playerui.android.testutils.asset

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.test.core.app.ApplicationProvider
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.runner.AndroidJUnit4
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.asset.asyncHydrationTrackerPlugin
import com.intuit.playerui.android.reference.assets.ReferenceAssetsPlugin
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.plugins.transactions.PendingTransactionPlugin
import com.intuit.playerui.plugins.types.CommonTypesPlugin
import com.intuit.playerui.utils.makeFlow
import com.intuit.playerui.utils.mocks.ClassLoaderMock
import com.intuit.playerui.utils.mocks.ClassLoaderMocksReader
import com.intuit.playerui.utils.mocks.Mock
import com.intuit.playerui.utils.mocks.getFlow
import com.intuit.playerui.utils.start
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.rules.TestName
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.LooperMode

@RunWith(AndroidJUnit4::class)
@LooperMode(LooperMode.Mode.INSTRUMENTATION_TEST)
@OptIn(ExperimentalCoroutinesApi::class)
public abstract class AssetTest(
    private val group: String? = null,
) {
    @get:Rule
    public val name: TestName = TestName()

    protected open val plugins: List<Plugin> by lazy { listOf(ReferenceAssetsPlugin(), CommonTypesPlugin(), PendingTransactionPlugin()) }

    protected val context: Context get() = ApplicationProvider.getApplicationContext()

    protected val player: AndroidPlayer by lazy {
        AndroidPlayer(plugins)
    }

    /** Flow that captures the latest view update - should be cleared once it is consumed */
    private var viewChannel = MutableSharedFlow<View>(replay = 1)

    /** Awaits [View] to be published to [viewChannel] and clears the replay cache to ensure we can wait for a new one */
    private suspend fun consumeLatestView(timeout: Long = 5_000): View = try {
        withTimeout(timeout) {
            viewChannel.first().apply {
                currentView = takeIf { it != emptyView }
                viewChannel.resetReplayCache()
            }
        }
    } catch (exception: CancellationException) {
        throw AssertionError("Expected view to update, but it did not.", exception)
    }

    private lateinit var activityController: ActivityController<ComponentActivity>

    private val hostActivity: ComponentActivity get() = activityController.get()

    private fun newRenderContainer(): FrameLayout = FrameLayout(hostActivity).also { container ->
        hostActivity.setContentView(container)
    }

    private lateinit var renderContainer: FrameLayout

    protected var currentAssetTree: RenderableAsset<*>? = null
        private set(value) {
            currentView = null
            field = value
            field?.let { asset ->
                CoroutineScope(Dispatchers.Main).run {
                    with(asset) { renderInto(renderContainer, hostActivity) }
                }
            }
        }

    protected var currentView: View? = null
        get() = field ?: blockUntilRendered()
        set(value) {
            field = value.also {
                // reset replay cache to clear value if the current value is set to null
                it ?: viewChannel.resetReplayCache()
            }
        }

    protected val currentState: PlayerFlowState get() = player.state

    protected val mocks: List<ClassLoaderMock> get() = ClassLoaderMocksReader(context.classLoader).mocks.filter {
        group == null || group == it.group
    }

    private val emptyView = View(context)

    @Before
    public fun beforeEach() {
        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            activityController = Robolectric.buildActivity(ComponentActivity::class.java).setup()
            renderContainer = newRenderContainer()
        }
        player.asyncHydrationTrackerPlugin!!.hooks.onHydrationComplete.tap("AssetTest-render") {
            CoroutineScope(Dispatchers.Main).launch {
                viewChannel.emit(renderContainer.getChildAt(0) ?: emptyView)
            }
        }
        player.onUpdate { asset, _ -> currentAssetTree = asset }
        player.hooks.state.tap { state ->
            if (state !is InProgressState) {
                // update the channel with an empty view to satisfy consumeLatestView condition
                viewChannel.tryEmit(emptyView)
            }
        }
    }

    @After
    public fun afterEach() {
    }

    protected fun launchMock(): Unit = launchMock(name.methodName)

    protected fun launchMock(name: String): Unit = launchMock(
        mocks.find { it.name == name || it.name == "$group-$name" }
            ?: throw IllegalArgumentException("$name not found in mocks: ${mocks.map { "${it.group}/${it.name}" }}"),
    )

    protected fun launchMock(mock: Mock<*>): Unit = launchJson(
        when (mock) {
            is ClassLoaderMock -> mock.getFlow(context.classLoader)
            else -> throw IllegalArgumentException("mock of type ${mock::class.java.simpleName} not supported")
        },
    )

    protected fun launchJson(json: JsonElement): Unit = launchJson(Json.encodeToString(json))

    protected fun launchJson(json: String): Unit = player.start(makeFlow(json)).onComplete {
        it.exceptionOrNull()?.printStackTrace()
    }

    /** Suspend until we have a [View] representation of [currentAssetTree] that is _completely_ hydrated */
    protected suspend fun awaitRendered(timeout: Long = 5_000): View = consumeLatestView(timeout)

    protected fun blockUntilRendered(timeout: Long = 5_000): View = runBlocking {
        awaitRendered(timeout)
    }
}
