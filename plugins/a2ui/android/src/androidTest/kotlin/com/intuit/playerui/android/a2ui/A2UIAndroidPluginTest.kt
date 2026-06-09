package com.intuit.playerui.android.a2ui

import androidx.test.runner.AndroidJUnit4
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.android.testutils.asset.shouldBeAsset
import com.intuit.playerui.android.testutils.asset.shouldBeAtState
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.StartOptions
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.plugins.types.CommonTypesPlugin
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Robolectric checks that the [A2UIAndroidPlugin] loads the A2UI bundle, that
 * starting with `format = "a2ui"` translates a snapshot into a Player flow, and
 * that the resolved asset tree is built from the registered Compose renderers.
 */
@RunWith(AndroidJUnit4::class)
@OptIn(ExperimentalPlayerApi::class)
class A2UIAndroidPluginTest {
    private val plugins: List<Plugin> = listOf(A2UIAndroidPlugin(), CommonTypesPlugin())

    private val player: AndroidPlayer by lazy {
        AndroidPlayer(plugins).also { it.onUpdate { asset, _ -> tree = asset } }
    }

    private var tree: RenderableAsset? = null

    private fun start(snapshot: String) {
        player.start(snapshot, StartOptions(format = "a2ui")).onComplete { it.exceptionOrNull()?.printStackTrace() }
    }

    @Test
    fun `button snapshot resolves to A2UIButton with a Text child`() {
        start(
            """
            {
              "surfaceId": "button-basic",
              "components": [
                { "id": "root", "component": "Button", "child": "lbl", "variant": "primary" },
                { "id": "lbl", "component": "Text", "text": "Click me" }
              ]
            }
            """.trimIndent(),
        )

        player.shouldBeAtState<InProgressState> {}
        runTest {
            tree.shouldBeAsset<A2UIButton> {
                val data = getData()
                assertEquals("primary", data.variant)
                assertNotNull(data.child)
                data.child.shouldBeAsset<A2UIText> {
                    assertEquals("Click me", getData().text)
                }
            }
        }
    }

    @Test
    fun `column snapshot resolves to A2UIColumn with children`() {
        start(
            """
            {
              "surfaceId": "column-basic",
              "components": [
                { "id": "root", "component": "Column", "children": ["a", "b"], "justify": "center" },
                { "id": "a", "component": "Text", "text": "First" },
                { "id": "b", "component": "Text", "text": "Second" }
              ]
            }
            """.trimIndent(),
        )

        player.shouldBeAtState<InProgressState> {}
        runTest {
            tree.shouldBeAsset<A2UIColumn> {
                val data = getData()
                assertEquals("center", data.justify)
                assertEquals(2, data.children.size)
                data.children[0].shouldBeAsset<A2UIText> { assertEquals("First", getData().text) }
                data.children[1].shouldBeAsset<A2UIText> { assertEquals("Second", getData().text) }
            }
        }
    }

    @Test
    fun `button secondary and destructive variants round-trip onto asset data`() {
        start(
            """
            {
              "surfaceId": "button-variants",
              "components": [
                { "id": "root", "component": "Row", "children": ["s", "d"] },
                { "id": "s", "component": "Button", "child": "sl", "variant": "secondary" },
                { "id": "sl", "component": "Text", "text": "Secondary" },
                { "id": "d", "component": "Button", "child": "dl", "variant": "destructive" },
                { "id": "dl", "component": "Text", "text": "Delete" }
              ]
            }
            """.trimIndent(),
        )

        player.shouldBeAtState<InProgressState> {}
        runTest {
            tree.shouldBeAsset<A2UIRow> {
                val children = getData().children
                children[0].shouldBeAsset<A2UIButton> { assertEquals("secondary", getData().variant) }
                children[1].shouldBeAsset<A2UIButton> { assertEquals("destructive", getData().variant) }
            }
        }
    }

    @Test
    fun `textField date type round-trips onto asset data`() {
        start(
            """
            {
              "surfaceId": "textfield-date",
              "components": [
                { "id": "root", "component": "TextField", "textFieldType": "date", "label": "When" }
              ]
            }
            """.trimIndent(),
        )

        player.shouldBeAtState<InProgressState> {}
        runTest {
            tree.shouldBeAsset<A2UITextField> {
                assertEquals("date", getData().textFieldType)
            }
        }
    }

    @Test
    fun `bound textField reads its current value from the model`() {
        start(
            """
            {
              "surfaceId": "textfield-bound",
              "data": { "user": { "name": "Ada" } },
              "components": [
                {
                  "id": "root",
                  "component": "TextField",
                  "label": "Name",
                  "value": { "path": "/user/name" },
                  "textFieldType": "shortText"
                }
              ]
            }
            """.trimIndent(),
        )

        player.shouldBeAtState<InProgressState> {}
        runTest {
            tree.shouldBeAsset<A2UITextField> {
                // currentValue is wired through the core transform from the bound model path.
                assertEquals("Ada", getData().currentValue)
            }
        }
    }

    @Test
    fun `row child weight is readable from the child node`() {
        start(
            """
            {
              "surfaceId": "row-weight",
              "components": [
                { "id": "root", "component": "Row", "children": ["a", "b"] },
                { "id": "a", "component": "Text", "text": "Grow", "weight": 3 },
                { "id": "b", "component": "Text", "text": "Fixed" }
              ]
            }
            """.trimIndent(),
        )

        player.shouldBeAtState<InProgressState> {}
        runTest {
            tree.shouldBeAsset<A2UIRow> {
                val children = getData().children
                // childLayout reads weight from the raw child node (React applies it per-child).
                assertEquals(3.0, children[0].a2uiWeight)
                assertEquals(null, children[1].a2uiWeight)
            }
        }
    }

    @Test
    fun `common A2UICommon fields round-trip onto asset data`() {
        start(
            """
            {
              "surfaceId": "text-common",
              "components": [
                {
                  "id": "root",
                  "component": "Text",
                  "text": "Hi",
                  "accessibility": "Greeting label",
                  "weight": 2
                }
              ]
            }
            """.trimIndent(),
        )

        player.shouldBeAtState<InProgressState> {}
        runTest {
            tree.shouldBeAsset<A2UIText> {
                val data = getData()
                assertEquals("Greeting label", data.accessibility)
                assertEquals(2.0, data.weight)
            }
        }
    }
}
