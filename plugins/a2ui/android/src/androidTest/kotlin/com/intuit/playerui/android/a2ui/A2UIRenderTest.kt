package com.intuit.playerui.android.a2ui

import com.intuit.playerui.android.testutils.asset.AssetTest
import com.intuit.playerui.android.testutils.asset.shouldBeAsset
import com.intuit.playerui.core.plugins.Plugin
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Instrumented test exercising the A2UI render pipeline on Android: the
 * `start(snapshot, "a2ui")` entrypoint adapts the snapshot to a flow and the
 * registered Compose assets render the resulting tree.
 */
class A2UIRenderTest : AssetTest() {
    override val plugins: List<Plugin> by lazy { listOf(A2UIPlugin()) }

    private val textSnapshot =
        """
        { "surfaceId": "text", "components": [
          { "id": "root", "component": "Text", "text": "Hello A2UI", "variant": "body" }
        ] }
        """.trimIndent()

    private val columnSnapshot =
        """
        { "surfaceId": "col", "components": [
          { "id": "root", "component": "Column", "children": ["a", "b"] },
          { "id": "a", "component": "Text", "text": "First" },
          { "id": "b", "component": "Text", "text": "Second" }
        ] }
        """.trimIndent()

    @Test
    fun text() {
        player.start(textSnapshot, "a2ui")
        runTest {
            currentAssetTree.shouldBeAsset<Text> {
                assertEquals("Hello A2UI", getData().text)
            }
        }
    }

    @Test
    fun column() {
        player.start(columnSnapshot, "a2ui")
        runTest {
            currentAssetTree.shouldBeAsset<Column> {
                assertEquals(2, getData().children.size)
            }
        }
    }
}
