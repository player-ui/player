package com.intuit.playerui.android.reference.assets.action

import androidx.core.view.get
import com.intuit.playerui.android.reference.assets.collection.Collection
import com.intuit.playerui.android.reference.assets.text.Text
import com.intuit.playerui.android.testutils.asset.AssetTest
import com.intuit.playerui.android.testutils.asset.shouldBeAsset
import com.intuit.playerui.android.testutils.asset.shouldBeAtState
import com.intuit.playerui.core.player.state.CompletedState
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.dataModel
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class ActionTest : AssetTest("action") {
    @Test
    fun actionExpression() {
        launchMock("action-basic")
        runTest {
            currentAssetTree.shouldBeAsset<Action> {
                val actionData = getData()
                repeat(10) {
                    player.shouldBeAtState<InProgressState> {
                        assertEquals(it, dataModel.get("count"))
                    }
                    actionData.run()
                }
            }
        }
    }

    @Test
    fun transitionToEndSuccess() {
        launchMock("action-transition-to-end")

        runTest {
            currentAssetTree.shouldBeAsset<Collection> {
                getData().values[0].shouldBeAsset<Action> {
                    val data = getData()
                    data.label.shouldBeAsset<Text> {
                        assertEquals("End the flow (success)", getData().value)
                    }
                    data.run()
                }
            }
        }

        player.shouldBeAtState<CompletedState> {
            assertEquals("done", endState.outcome)
        }
    }

    // TODO: Fix invalid expression not throwing error in core
    @Test
    fun transitionToEndError() {
        launchMock("action-transition-to-end")

        runTest {
            currentAssetTree.shouldBeAsset<Collection> {
                getData().values[1].shouldBeAsset<Action> {
                    val data = getData()
                    data.label.shouldBeAsset<Text> {
                        assertEquals("End the flow (error)", getData().value)
                    }
                    data.run()
                }
            }
        }

        player.shouldBeAtState<ErrorState> {
            assertEquals("Error: Unclosed brace after \"foo.bar..}\" at character 12", error.message)
        }
    }
}
