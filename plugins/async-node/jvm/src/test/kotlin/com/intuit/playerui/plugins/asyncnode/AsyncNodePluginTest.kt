package com.intuit.playerui.plugins.asyncnode

import com.intuit.hooks.BailResult
import com.intuit.playerui.android.reference.assets.ReferenceAssetsPlugin
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
import org.amshove.kluent.internal.assertEquals
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.TestTemplate
import org.junit.jupiter.api.assertThrows
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

    private val chatMessageContent =
        """
    {
      "id": "chat",
      "views": [
          {
          "id": "1",
          "type": "chat-message",
          "value": {
            "asset": {
              "id": "2",
              "type": "text",
              "value": "Hello World!",
              },
            },
          },
      ],
      "navigation": {
          "BEGIN": "FLOW_1",
          "FLOW_1": {
          "startState": "VIEW_1",
          "VIEW_1": {
              "state_type": "VIEW",
              "ref": "1",
              "transitions": {
              "*": "END_Done"
              }
          },
          "END_Done": {
              "state_type": "END",
              "outcome": "DONE"
          }
        }
      }
    }
        """.trimMargin()

    override val plugins = listOf(AsyncNodePlugin(), ReferenceAssetsPlugin())

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
    fun `async node hook is tappable for chat-message asset and replaces async nodes with provided node`() =
        runBlockingTest {
            var update: Asset? = null
            plugin?.hooks?.onAsyncNode?.tap("") { _, node, callback ->
                BailResult.Bail(
                    mapOf(
                        "asset" to mapOf(
                            "id" to "6",
                            "type" to "text",
                            "value" to "New",
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

                player.start(chatMessageContent)
            }
            Assertions.assertTrue(count == 2)
            val values = (update as? Map<*, *>)?.get("values") as? List<*>
            Assertions.assertNotNull(values)
            Assertions.assertEquals(2, values?.size)

            val asset0 = (values?.get(0) as? Map<*, *>)?.get("asset") as? Map<*, *>
            val asset1 = (values?.get(1) as? Map<*, *>)?.get("asset") as? Map<*, *>

            Assertions.assertEquals("text", asset0?.get("type"))
            Assertions.assertEquals("Hello World!", asset0?.get("value"))

            Assertions.assertEquals("6", asset1?.get("id"))
            Assertions.assertEquals("text", asset1?.get("type"))
            Assertions.assertEquals("New", asset1?.get("value"))
        }

    @TestTemplate
    fun `async node error bubbles up and fails the player state`() =
        runBlockingTest {
            plugin.hooks.onAsyncNode.tap("test") { _, node, callback ->
                throw Exception("This is an error message from onAsyncNode")
            }

            val errorMessage = assertThrows<Exception> {
                runBlockingTest {
                    player.start(chatMessageContent).await()
                }
            }.message
            assertEquals("This is an error message from onAsyncNode", errorMessage)
        }

    @TestTemplate
    fun `async node error hook catches and gracefully handles the error`() =
        runBlockingTest {
            plugin.hooks.onAsyncNode.tap("test") { _, node, callback ->
                throw Exception("This is an error message from onAsyncNode")
            }

            plugin.hooks.onAsyncNodeError.tap("test") { _, error, node ->
                BailResult.Bail(
                    mapOf(
                        "asset" to mapOf(
                            "type" to "text",
                            "id" to "error-asset",
                            "value" to "Value",
                        ),
                    ),
                )
            }

            var count = 0
            var update: Asset? = null
            suspendCancellableCoroutine { cont ->
                player.hooks.view.tap { v ->
                    v?.hooks?.onUpdate?.tap { asset ->
                        count++
                        update = asset
                        if (count == 2) cont.resume(true) {}
                    }
                }

                player.start(chatMessageContent)
            }

            val values = (update as? Map<*, *>)?.get("values") as? List<*>
            Assertions.assertNotNull(values)
            Assertions.assertEquals(2, values?.size)

            val asset0 = (values?.get(1) as? Map<*, *>)?.get("asset") as? Map<*, *>
            Assertions.assertNotNull(asset0)
            Assertions.assertEquals("text", asset0?.get("type"))
            Assertions.assertEquals("Value", asset0?.get("value"))
            Assertions.assertEquals("error-asset", asset0?.get("id"))
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
        Assertions.assertEquals(2, update?.getList("actions")?.size)
        Assertions.assertEquals(2, update?.getList("actions")?.filterIsInstance<ArrayList<Node>>()?.get(0)?.size)
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
            view.getList("actions")?.filterIsInstance<ArrayList<Node>>()?.get(0)?.get(0)?.getObject("asset")
                ?.get("type"),
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

    @TestTemplate
    fun `chat-message asset - resolve single chat-message`() = runBlockingTest {
        var asyncTaps = 0
        var updateNumber = 0
        player.hooks.view.tap { v ->
            v?.hooks?.onUpdate?.tap { asset ->
                updateNumber++
                when (updateNumber) {
                    1 -> {
                        val values = (asset as? Map<*, *>)?.get("values") as? List<*>
                        Assertions.assertNotNull(values)
                        Assertions.assertEquals(1, values?.size)

                        val asset0 = (values?.get(0) as? Map<*, *>)?.get("asset") as? Map<*, *>
                        Assertions.assertEquals("2", asset0?.get("id"))
                        Assertions.assertEquals("text", asset0?.get("type"))
                        Assertions.assertEquals("Hello World!", asset0?.get("value"))
                    }

                    else -> {
                        val values = (asset as? Map<*, *>)?.get("values") as? List<*>

                        Assertions.assertNotNull(values)
                        Assertions.assertEquals(2, values?.size)

                        val asset0 = (values?.get(0) as? Map<*, *>)?.get("asset") as? Map<*, *>
                        Assertions.assertEquals("2", asset0?.get("id"))
                        Assertions.assertEquals("text", asset0?.get("type"))
                        Assertions.assertEquals("Hello World!", asset0?.get("value"))

                        val asset1 = (values?.get(1) as? Map<*, *>)?.get("asset") as? Map<*, *>
                        Assertions.assertEquals("text2", asset1?.get("id"))
                        Assertions.assertEquals("text", asset1?.get("type"))
                        Assertions.assertEquals("async content", asset1?.get("value"))
                    }
                }
            }
        }
        plugin?.hooks?.onAsyncNode?.tap("") { _, node, callback ->
            asyncTaps++
            when (asyncTaps) {
                1 -> BailResult.Bail(
                    mapOf(
                        "asset" to mapOf(
                            "id" to "text3",
                            "type" to "chat-message",
                            "value" to mapOf(
                                "asset" to mapOf(
                                    "id" to "text2",
                                    "type" to "text",
                                    "value" to "async content",
                                ),
                            ),
                        ),
                    ),
                )
                else -> {
                    BailResult.Continue()
                }
            }
        }

        player.start(chatMessageContent)

        suspendCancellableCoroutine { cont ->
            while (updateNumber < 2) runBlocking { delay(5) }
            if (updateNumber == 2) cont.resume(true) {}
        }
        Assertions.assertTrue(true)
    }

    @TestTemplate
    fun `chat-message asset - resolve chained chat-message`() = runBlockingTest {
        var asyncTaps = 0
        var updateNumber = 0
        player.hooks.view.tap { v ->
            v?.hooks?.onUpdate?.tap { asset ->
                updateNumber++
                when (updateNumber) {
                    1 -> {
                        val values = (asset as? Map<*, *>)?.get("values") as? List<*>
                        Assertions.assertNotNull(values)
                        Assertions.assertEquals(1, values?.size)

                        val asset0 = (values?.get(0) as? Map<*, *>)?.get("asset") as? Map<*, *>
                        Assertions.assertEquals("2", asset0?.get("id"))
                        Assertions.assertEquals("text", asset0?.get("type"))
                        Assertions.assertEquals("Hello World!", asset0?.get("value"))
                    }

                    2 -> {
                        val values = (asset as? Map<*, *>)?.get("values") as? List<*>
                        Assertions.assertNotNull(values)
                        Assertions.assertEquals(2, values?.size)

                        val asset0 = (values?.get(0) as? Map<*, *>)?.get("asset") as? Map<*, *>
                        Assertions.assertEquals("2", asset0?.get("id"))
                        Assertions.assertEquals("text", asset0?.get("type"))
                        Assertions.assertEquals("Hello World!", asset0?.get("value"))

                        val asset1 = (values?.get(1) as? Map<*, *>)?.get("asset") as? Map<*, *>
                        Assertions.assertEquals("text2", asset1?.get("id"))
                        Assertions.assertEquals("text", asset1?.get("type"))
                        Assertions.assertEquals("chat-message asset", asset1?.get("value"))
                    }

                    else -> {
                        val values = (asset as? Map<*, *>)?.get("values") as? List<*>
                        Assertions.assertNotNull(values)
                        Assertions.assertEquals(3, values?.size)
                        val asset0 = (values?.get(0) as? Map<*, *>)?.get("asset") as? Map<*, *>
                        Assertions.assertEquals("2", asset0?.get("id"))
                        Assertions.assertEquals("text", asset0?.get("type"))
                        Assertions.assertEquals("Hello World!", asset0?.get("value"))

                        val asset1 = (values?.get(1) as? Map<*, *>)?.get("asset") as? Map<*, *>
                        Assertions.assertEquals("text2", asset1?.get("id"))
                        Assertions.assertEquals("text", asset1?.get("type"))
                        Assertions.assertEquals("chat-message asset", asset1?.get("value"))

                        val asset2 = (values?.get(2) as? Map<*, *>)?.get("asset") as? Map<*, *>
                        Assertions.assertEquals("4", asset2?.get("id"))
                        Assertions.assertEquals("text", asset2?.get("type"))
                        Assertions.assertEquals("normal text", asset2?.get("value"))
                    }
                }
            }
        }
        plugin?.hooks?.onAsyncNode?.tap("") { _, node, callback ->
            asyncTaps++
            when (asyncTaps) {
                1 -> BailResult.Bail(
                    mapOf(
                        "asset" to mapOf(
                            "id" to "3",
                            "type" to "chat-message",
                            "value" to mapOf(
                                "asset" to mapOf(
                                    "id" to "text2",
                                    "type" to "text",
                                    "value" to "chat-message asset",
                                ),
                            ),
                        ),
                    ),

                )

                else -> BailResult.Bail(
                    mapOf(
                        "asset" to mapOf(
                            "id" to "4",
                            "type" to "text",
                            "value" to "normal text",
                        ),
                    ),
                )
            }
        }

        player.start(chatMessageContent)

        suspendCancellableCoroutine { cont ->
            while (updateNumber < 3) runBlocking { delay(5) }
            if (updateNumber == 3) cont.resume(true) {}
        }
        Assertions.assertTrue(true)
    }

    @TestTemplate
    fun `constructor test - pass in handler in constructor`() = runBlockingTest {
        val handler = { node: Node, callback: ((result: Any?) -> Unit)? ->
            mapOf(
                "asset" to mapOf(
                    "id" to "asset-1",
                    "type" to "text",
                    "value" to "New asset!",
                ),
            )
        }

        setupPlayer(listOf(AsyncNodePlugin(asyncHandler = handler), ReferenceAssetsPlugin()))

        var update: Asset? = null

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
    fun `constructor test - with callback function`() = runBlockingTest {
        var deferredResolve: ((asyncNodeUpdate) -> Unit)? = null
        var updateContent: ((asyncNodeUpdate) -> Unit)? = null

        val handler: AsyncHandler = { node: Node, callback: ((result: Any?) -> Unit)? ->
            updateContent = callback

            suspendCoroutine { cont ->
                deferredResolve = { value ->
                    cont.resume(value)
                }
            }
        }

        setupPlayer(listOf(AsyncNodePlugin(handler), ReferenceAssetsPlugin()))

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
            view.getList("actions")?.filterIsInstance<ArrayList<Node>>()?.get(0)?.get(0)?.getObject("asset")
                ?.get("type"),
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
}
