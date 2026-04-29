package com.intuit.playerui.android.compose

import android.view.View
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import androidx.appcompat.view.ContextThemeWrapper
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.asset.SuspendableAsset.AsyncViewStub
import com.intuit.playerui.android.renderer.BaseRenderableAssetTest
import com.intuit.playerui.android.utils.ContextCapturingAsset
import com.intuit.playerui.android.utils.NestedComposableAsset
import com.intuit.playerui.android.utils.SimpleComposableAsset
import com.intuit.playerui.android.utils.StyledNestedComposableAsset
import com.intuit.playerui.android.utils.TextStyleCapturingAsset
import com.intuit.playerui.android.utils.awaitFirstView
import com.intuit.playerui.android.utils.waitForCondition
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.flow.Flow
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.utils.InternalPlayerApi
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@OptIn(ExperimentalPlayerApi::class)
@RunWith(AndroidJUnit4::class)
internal class ComposableAssetTest : BaseRenderableAssetTest() {
    @get:Rule
    val composeRule = createComposeRule()

    override val asset: Asset get() = SimpleComposableAsset.sampleAsset

    override val player by lazy {
        AndroidPlayer(beaconPlugin).apply {
            registerAsset("simple-compose", ::SimpleComposableAsset)
            registerAsset("nested-compose", ::NestedComposableAsset)
            registerAsset("styled-nested-compose", ::StyledNestedComposableAsset)
            registerAsset("context-capturing", ::ContextCapturingAsset)
            registerAsset("text-style-capturing", ::TextStyleCapturingAsset)
            val inProgressState = mockk<InProgressState>()
            every { inProgressState.flow } returns Flow()
            hooks.state.call(HashMap(), arrayOf(inProgressState))
        }
    }

    override val assetContext: AssetContext by lazy {
        AssetContext(appContext, asset, player, ::SimpleComposableAsset)
    }

    @Before
    fun resetCaptures() {
        ContextCapturingAsset.reset()
        TextStyleCapturingAsset.reset()
    }

    @OptIn(InternalPlayerApi::class)
    private fun resolveView(stub: View?) = if (stub is AsyncViewStub) runBlocking { stub.awaitView() } else stub

    @Test
    fun `initView creates ComposeView with WRAP_CONTENT`() = runBlocking {
        val asset = SimpleComposableAsset(assetContext)
        val view = resolveView(asset.render(appContext))
        assertTrue(view is ComposeView)
        assertEquals(WRAP_CONTENT, view!!.layoutParams.width)
        assertEquals(WRAP_CONTENT, view.layoutParams.height)
    }

    @Test
    fun `compose renders content when data available`() = runBlocking {
        val asset = player.awaitFirstView(SimpleComposableAsset.sampleFlow)
        val view = resolveView(asset?.render(appContext))
        assertTrue("Expected ComposeView", view is ComposeView)
    }

    @Test
    fun `nested ComposableAsset renders via compose dispatch`(): Unit = runBlocking {
        val asset = player.awaitFirstView(NestedComposableAsset.sampleFlow)
        assertNotNull("Expected asset from flow", asset)
        val view = resolveView(asset?.render(appContext)) as ComposeView

        composeRule.setContent { AndroidView(factory = { view }) }
        composeRule.waitForIdle()
        composeRule.onNodeWithTag("nested-compose").assertExists()
        composeRule.onNodeWithTag("child-tag").assertExists()
    }

    @Test
    fun `Compose to Compose propagates textStyle via LocalTextStyle`() = runBlocking {
        val asset = player.awaitFirstView(StyledNestedComposableAsset.styledComposeChildFlow)
        assertNotNull("Expected asset from flow", asset)
        val view = resolveView(asset?.render(appContext)) as ComposeView

        composeRule.setContent { AndroidView(factory = { view }) }
        composeRule.waitForIdle()
        waitForCondition { TextStyleCapturingAsset.lastCapturedTextStyle != null }

        val captured = TextStyleCapturingAsset.lastCapturedTextStyle
        assertNotNull("TextStyle should have been captured", captured)
        assertEquals(
            "textStyle fontSize should be propagated from parent",
            24.sp,
            captured!!.fontSize,
        )
    }

    @Test
    fun `Compose to Compose to XML view propagates xmlStyles through LocalContext`() = runBlocking {
        val asset = player.awaitFirstView(StyledNestedComposableAsset.styledComposeToViewFlow)
        assertNotNull("Expected asset from flow", asset)
        val view = resolveView(asset?.render(appContext)) as ComposeView

        composeRule.setContent { AndroidView(factory = { view }) }
        composeRule.waitForIdle()
        waitForCondition { ContextCapturingAsset.lastCapturedContext != null }

        val capturedContext = ContextCapturingAsset.lastCapturedContext
        assertNotNull(
            "XML view should have been rendered through Compose→Compose→XML chain",
            capturedContext,
        )
        assertTrue(
            "XML view context should be a ContextThemeWrapper from xmlStyles propagated through LocalContext",
            capturedContext is ContextThemeWrapper,
        )
    }
}
