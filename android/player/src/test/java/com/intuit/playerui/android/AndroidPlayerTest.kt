package com.intuit.playerui.android

import android.content.Context
import com.intuit.player.plugins.beacon.BeaconPlugin
import com.intuit.player.plugins.beacon.beaconPlugin
import com.intuit.player.plugins.pubsub.PubSubPlugin
import com.intuit.player.plugins.pubsub.pubSubPlugin
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.utils.SimpleAsset
import com.intuit.playerui.android.utils.TestAssetsPlugin
import com.intuit.playerui.android.utils.awaitFirstView
import com.intuit.playerui.core.bridge.PlayerRuntimeException
import com.intuit.playerui.core.player.HeadlessPlayer
import com.intuit.playerui.utils.start
import com.intuit.playerui.utils.test.runBlockingTest
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith

@ExtendWith(MockKExtension::class)
internal class AndroidPlayerTest {

    @MockK lateinit var mockContext: Context

    @Test
    fun `test list constructor`() {
        val player = AndroidPlayer(listOf())

        assertEquals(5, player.plugins.size)
        assertNotNull(player.beaconPlugin)
        assertNotNull(player.pubSubPlugin)
    }

    @Test
    fun `injects default plugins with self-contained headless player`() {
        val player = AndroidPlayer()

        assertEquals(5, player.plugins.size)
        assertNotNull(player.beaconPlugin)
        assertNotNull(player.pubSubPlugin)
    }

    // @Test // disabled
    fun `cannot inject default plugins with provided headless player`() {
        val headless = HeadlessPlayer()
        val player = AndroidPlayer(headless)

        assertEquals(0, player.plugins.size)
        assertNull(player.beaconPlugin)
        assertNull(player.pubSubPlugin)
    }

    @Test
    fun `doesn't override plugins with default plugins`() {
        val pubSubPlugin = PubSubPlugin()
        val beaconPlugin = BeaconPlugin()
        val player = AndroidPlayer(pubSubPlugin, beaconPlugin)

        assertEquals(5, player.plugins.size)
        assertEquals(beaconPlugin, player.beaconPlugin)
        assertEquals(pubSubPlugin, player.pubSubPlugin)
    }

    @Test
    fun `test manual asset registration`() = runBlockingTest {
        val player = AndroidPlayer()
        player.registerAsset(mapOf(TYPE to "simple"), ::SimpleAsset)

        assertTrue(player.awaitFirstView(SimpleAsset.sampleFlow) is SimpleAsset)
    }

    @Test
    fun `test registering same asset implementation multiple times`() = runBlockingTest {
        val player = AndroidPlayer()
        player.registerAsset("simple", ::SimpleAsset)
        player.registerAsset("complex", ::SimpleAsset)

        assertTrue(player.awaitFirstView(SimpleAsset.sampleFlow) is SimpleAsset)
    }

    @Test
    fun `test registration helper`() = runBlockingTest {
        val player = AndroidPlayer()
        player.registerAsset("simple", ::SimpleAsset)

        assertTrue(player.awaitFirstView(SimpleAsset.sampleFlow) is SimpleAsset)
    }

    @Test
    fun `asset expansion handles an unknown asset type`() = runBlockingTest {
        val player = AndroidPlayer()
        assertNull(player.awaitFirstView(SimpleAsset.sampleFlow))
    }

    @Test
    fun `release puts player in unusable state`() {
        val player = AndroidPlayer()
        player.release()
        assertThrows<PlayerRuntimeException> {
            player.start(SimpleAsset.sampleFlow)
        }
    }

    @Test
    fun `recycle clears caches but is still usable`() = runBlockingTest {
        val player = AndroidPlayer()
        player.registerAsset("simple", ::SimpleAsset)
        val asset = player.awaitFirstView(SimpleAsset.sampleFlow)!!
        assertNull(player.getCachedAssetView(asset.assetContext))
        assertNotNull(asset.render(mockContext))
        assertNotNull(player.getCachedAssetView(asset.assetContext))
        player.recycle()
        assertNull(player.getCachedAssetView(asset.assetContext))
        assertNotNull(player.start(SimpleAsset.sampleFlow))
    }

    @Test
    fun `cannot encode a renderable asset`() = runBlockingTest {
        val player = AndroidPlayer(TestAssetsPlugin)
        val serializer = RenderableAsset.Serializer(player).conform<RenderableAsset>()
        player.registerAsset("simple", ::SimpleAsset)
        val asset = player.awaitFirstView(SimpleAsset.sampleFlow)!!
        assertEquals(
            "DecodableAsset.Serializer.serialize is not supported",
            assertThrows<SerializationException> {
                Json.encodeToString(serializer, asset)
            }.message,
        )
    }
}
