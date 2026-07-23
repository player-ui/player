package com.intuit.playerui.android.a2ui

import com.intuit.playerui.android.testutils.asset.AssetTest
import com.intuit.playerui.android.testutils.asset.shouldBeAsset
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.utils.mocks.ClassLoaderMocksReader
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Instrumented test exercising the A2UI render pipeline on Android: the
 * `start(snapshot, "a2ui")` entrypoint adapts the snapshot to a flow and the
 * registered Compose assets render the resulting tree.
 *
 * Snapshots come from the canonical catalog (`//plugins/a2ui/mocks:jar`) via its
 * dedicated manifest, so this stays in lockstep with the shared A2UI mocks.
 */
class A2UIRenderTest : AssetTest() {
    override val plugins: List<Plugin> by lazy { listOf(A2UIPlugin()) }

    private val catalog = ClassLoaderMocksReader(
        this::class.java.classLoader!!,
        manifestPath = "a2ui/mocks/manifest.json",
    ).mocks

    private fun snapshot(group: String, name: String): String {
        val mock = catalog.first { it.group == group && it.name == name }
        return mock.read(this::class.java.classLoader!!)
    }

    @Test
    fun catalogAdaptsAndStartsEverySnapshot() {
        assertTrue("Expected A2UI mock catalog on the classpath", catalog.isNotEmpty())

        catalog
            // `expressions/showcase` exercises the Intl-based formatters
            // (formatCurrency/formatDate), and the native JS engines (Hermes/J2V8/
            // GraalJS) ship without `Intl`. It renders on JavaScriptCore (iOS) and
            // the browser; skip it where the runtime has no `Intl`.
            .filterNot { it.group == "expressions" }
            .forEach { mock ->
                player.start(mock.read(this::class.java.classLoader!!), "a2ui")
                assertTrue(
                    "Expected ${mock.group}/${mock.name} to start as an in-progress A2UI flow",
                    currentState is InProgressState,
                )
            }
    }

    @Test
    fun text() {
        player.start(snapshot("text", "basic"), "a2ui")
        runTest {
            currentAssetTree.shouldBeAsset<Text> {
                assertEquals("Hello A2UI", getData().text)
            }
        }
    }

    @Test
    fun column() {
        player.start(snapshot("column", "basic"), "a2ui")
        runTest {
            currentAssetTree.shouldBeAsset<Column> {
                assertEquals(3, getData().children.size)
            }
        }
    }
}
