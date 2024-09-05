package com.intuit.playerui.plugins.asyncnode

import com.intuit.hooks.BailResult
import com.intuit.playerui.core.asset.Asset
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.player.state.lastViewUpdate
import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.utils.test.runBlockingTest
import io.mockk.junit5.MockKExtension
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.yield
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.TestTemplate
import org.junit.jupiter.api.extension.ExtendWith
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

@ExtendWith(MockKExtension::class)
internal class AsyncNodePluginTest : PlayerTest() {

    private val asyncNodeFlowSimple =
        """{
          "id": "counter-flow",
          "views": [
            {
              "id": 'action',
              "actions": [
                {
            "asset": {
              "id": "action-0",
              "type": "action",
              "value": "{{foo.bar}}",
            },
          },
          {
            "id": "nodeId",
            "async": true,
          },
              ],
            },
          ],
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "VIEW_1",
              "VIEW_1": {
                "state_type": "VIEW",
                "ref": "action",
                "transitions": {
                  "*": "END_Done"
                }
              },
              "END_Done": {
                "state_type": "END",
                "outcome": "done",
                "param": {
                  "someKey": "someValue"
                },
                "extraKey": "extraValue",
                "extraObject": {
                  "someInt": 1
                }
              }
            }
          }
        }
        """.trimMargin()

    override val plugins = listOf(AsyncNodePlugin())

    private val plugin get() = player.asyncNodePlugin!!

    @TestTemplate
    fun `plugin is not null`() {
        Assertions.assertNotNull(plugin)
    }

    @TestTemplate
    fun `async node hook is tappable`() = runBlockingTest {
        var update: Asset? = null
        plugin?.hooks?.onAsyncNode?.tap("") { _, node, callback ->
            BailResult.Bail(
                listOf(
                    mapOf(
                        "asset" to mapOf(
                            "id" to "asset-1",
                            "type" to "text",
                            "value" to "New asset!",
                        ),
                    ),
                ),
            )
        }
        var count = 0
        suspendCancellableCoroutine { cont ->
            player.hooks.view.tap { v ->
                v?.hooks?.onUpdate?.tap { asset ->
                    count++
                    update = asset
                    if (count == 2) cont.resume(true) {}
                }
            }
            player.start(asyncNodeFlowSimple)
        }
        Assertions.assertTrue(count == 2)
        Assertions.assertTrue((update?.get("actions") as List<*>).isNotEmpty())
    }

    @TestTemplate
    fun `replace async node with multiNode`() = runBlockingTest {
        var update: Asset? = null
        plugin?.hooks?.onAsyncNode?.tap("") { _, node, callback ->
            BailResult.Bail(
                listOf(
                    mapOf(
                        "asset" to mapOf(
                            "id" to "asset-1",
                            "type" to "text",
                            "value" to "New asset!",
                        ),
                    ),
                    mapOf(
                        "asset" to mapOf(
                            "id" to "asset-2",
                            "type" to "text",
                            "value" to "New asset!",
                        ),
                    ),
                ),
            )
        }
        var count = 0
        suspendCancellableCoroutine { cont ->
            player.hooks.view.tap { v ->
                v?.hooks?.onUpdate?.tap { asset ->
                    count++
                    update = asset
                    if (count == 2) cont.resume(true) {}
                }
            }
            player.start(asyncNodeFlowSimple)
        }
        Assertions.assertTrue(count == 2)
        Assertions.assertEquals(3, update?.getList("actions")?.size)
    }

    @TestTemplate
    fun `chain async test`() = runBlockingTest {
        var asyncTaps = 0
        var updateNumber = 0
        player.hooks.view.tap { v ->
            v?.hooks?.onUpdate?.tap { asset ->
                updateNumber++
                when (updateNumber) {
                    1 -> {}
                    2 -> {
                        Assertions.assertEquals(1, (asset?.get("actions") as List<*>).size)
                    }

                    3 -> {
                        Assertions.assertEquals(2, (asset?.get("actions") as List<*>).size)
                    }

                    4 -> {
                        Assertions.assertEquals(4, (asset?.get("actions") as List<*>).size)
                    }
                }
            }
        }
        plugin?.hooks?.onAsyncNode?.tap("") { _, node, callback ->
            asyncTaps++
            when (asyncTaps) {
                1 -> BailResult.Bail(
                    listOf(
                        mapOf(
                            "asset" to mapOf(
                                "id" to "asset-1",
                                "type" to "text",
                                "value" to "New asset!",
                            ),
                        ),
                        mapOf(
                            "id" to "another-async",
                            "async" to true,
                        ),
                    ),
                )

                2 -> BailResult.Bail(
                    listOf(
                        mapOf(
                            "asset" to mapOf(
                                "id" to "asset-2",
                                "type" to "text",
                                "value" to "Another new asset!",
                            ),
                        ),
                        mapOf(
                            "id" to "yet-another",
                            "async" to true,
                        ),
                    ),
                )

                else -> BailResult.Bail(
                    listOf(
                        mapOf(
                            "asset" to mapOf(
                                "id" to "asset-3",
                                "type" to "text",
                                "value" to "Third new asset!",
                            ),
                        ),
                        mapOf(
                            "asset" to mapOf(
                                "id" to "asset-4",
                                "type" to "text",
                                "value" to "Fourth new asset!",
                            ),
                        ),
                    ),
                )
            }
        }

        player.start(asyncNodeFlowSimple)

        suspendCancellableCoroutine { cont ->
            while (updateNumber < 4) runBlocking { delay(5) }
            if (updateNumber == 4) cont.resume(true) {}
        }
        Assertions.assertTrue(true)
    }

    @TestTemplate
    fun `handle multiple updates through callback mechanism`() = runBlockingTest {
        // TODO: This typing is not great - need to go fix hook types
        var deferredResolve: ((asyncNodeUpdate) -> Unit)? = null
        var updateContent: ((asyncNodeUpdate) -> Unit)? = null

        var count = 0

        plugin.hooks.onAsyncNode.tap("") { _, node, callback ->
            updateContent = callback
            val result = suspendCoroutine { cont ->
                deferredResolve = { value ->
                    cont.resume(value)
                }
            }
            BailResult.Bail(result)
        }

        player.hooks.view.tap { v ->
            v?.hooks?.onUpdate?.tap { asset ->
                count++
            }
        }
        player.start(asyncNodeFlowSimple)

        var view = player.inProgressState?.lastViewUpdate
        Assertions.assertNotNull(view)
        Assertions.assertEquals(
            "action",
            view!!.getList("actions")?.filterIsInstance<Node>()?.get(0)?.getObject("asset")?.get("type"),
        )
        Assertions.assertEquals(1, view.getList("actions")?.size)

        while (true) {
            if (deferredResolve != null) {
                break
            }

            yield()
        }

        // create a view object to pass it to the deferred resolve
        val viewObject = mapOf(
            "asset" to mapOf(
                "id" to "asset-1",
                "type" to "action",
                "value" to "New asset!",
            ),
        )

        deferredResolve!!.invoke(listOf(viewObject))

        Assertions.assertEquals(1, count)

        view = player.inProgressState?.lastViewUpdate

        Assertions.assertNotNull(view)
        Assertions.assertEquals(
            "action",
            view!!.getList("actions")?.filterIsInstance<Node>()?.get(0)?.getObject("asset")?.get("type"),
        )
        Assertions.assertEquals(
            "action",
            view.getList("actions")?.filterIsInstance<Node>()?.get(1)?.getObject("asset")?.get("type"),
        )
        Assertions.assertEquals(2, view.getList("actions")?.size)
        Assertions.assertEquals(2, count)

        updateContent!!.invoke(null)

        Assertions.assertEquals(3, count)
        view = player.inProgressState?.lastViewUpdate

        Assertions.assertNotNull(view)
        Assertions.assertEquals(
            "action",
            view!!.getList("actions")?.filterIsInstance<Node>()?.get(0)?.getObject("asset")?.get("type"),
        )
        Assertions.assertEquals(1, view.getList("actions")?.size)
    }

    @TestTemplate
    fun `handle null node`() = runBlockingTest {
        // TODO: This typing is not great - need to go fix hook types
        var deferredResolve: ((asyncNodeUpdate) -> Unit)? = null
        var updateContent: ((asyncNodeUpdate) -> Unit)? = null

        plugin.hooks.onAsyncNode.tap("") { _, node, callback ->
            updateContent = callback
            val result = suspendCoroutine { cont ->
                deferredResolve = { value ->
                    cont.resume(value)
                }
            }

            BailResult.Bail(result)
        }

        var count = 0
        player.hooks.view.tap { v ->
            v?.hooks?.onUpdate?.tap { asset ->
                count++
            }
        }

        player.start(asyncNodeFlowSimple)

        var view = player.inProgressState?.lastViewUpdate

        Assertions.assertNotNull(view)
        Assertions.assertEquals(
            "action",
            view!!.getList("actions")?.filterIsInstance<Node>()?.get(0)?.getObject("asset")?.get("type"),
        )
        Assertions.assertEquals(1, view.getList("actions")?.size)

        while (true) {
            if (deferredResolve != null) {
                break
            }

            yield()
        }

        deferredResolve!!.invoke(null)

        Assertions.assertEquals(1, count)

        view = player.inProgressState?.lastViewUpdate

        Assertions.assertNotNull(view)
        Assertions.assertEquals(
            "action",
            view!!.getList("actions")?.filterIsInstance<Node>()?.get(0)?.getObject("asset")?.get("type"),
        )
        Assertions.assertEquals(1, view.getList("actions")?.size)

        updateContent!!.invoke(null)

        Assertions.assertEquals(1, count)

        view = player.inProgressState?.lastViewUpdate

        Assertions.assertNotNull(view)
        Assertions.assertEquals(
            "action",
            view!!.getList("actions")?.filterIsInstance<Node>()?.get(0)?.getObject("asset")?.get("type"),
        )
        Assertions.assertEquals(1, view.getList("actions")?.size)
    }
}
