package com.intuit.playerui.android.compose

import androidx.appcompat.view.ContextThemeWrapper
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.sp
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AssetContext
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

    @Test
    fun `compose renders content when data available`() {
        val asset = runBlocking { player.awaitFirstView(SimpleComposableAsset.sampleFlow) } as? SimpleComposableAsset
        assertNotNull("Expected asset from flow", asset)
        val data = runBlocking { asset!!.getData() }

        composeRule.setContent { asset!!.compose(data) }
        composeRule.waitForIdle()
        composeRule.onNodeWithTag("simple-compose").assertExists()
    }

    @Test
    fun `nested ComposableAsset renders via compose dispatch`() {
        val asset = runBlocking { player.awaitFirstView(NestedComposableAsset.sampleFlow) } as? NestedComposableAsset
        assertNotNull("Expected asset from flow", asset)
        val data = runBlocking { asset!!.getData() }

        composeRule.setContent { asset!!.compose(data) }
        composeRule.waitForIdle()
        composeRule.onNodeWithTag("nested-compose").assertExists()
        composeRule.onNodeWithTag("child-tag").assertExists()
    }

    @Test
    fun `Compose to Compose propagates textStyle via LocalTextStyle`() {
        val asset = runBlocking {
            player.awaitFirstView(StyledNestedComposableAsset.styledComposeChildFlow)
        } as? StyledNestedComposableAsset
        assertNotNull("Expected asset from flow", asset)
        val data = runBlocking { asset!!.getData() }

        composeRule.setContent { asset!!.compose(data) }
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
    fun `Compose to Compose to XML view propagates xmlStyles through LocalContext`() {
        val asset = runBlocking {
            player.awaitFirstView(StyledNestedComposableAsset.styledComposeToViewFlow)
        } as? StyledNestedComposableAsset
        assertNotNull("Expected asset from flow", asset)
        val data = runBlocking { asset!!.getData() }

        composeRule.setContent { asset!!.compose(data) }
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
