package com.intuit.playerui.android.reference.demo.test.base

import androidx.test.espresso.intent.Intents
import androidx.test.ext.junit.rules.activityScenarioRule
import com.intuit.playerui.android.reference.demo.lifecycle.DemoPlayerViewModel
import com.intuit.playerui.android.reference.demo.ui.main.MainActivity
import com.intuit.playerui.android.reference.demo.ui.main.MainViewModel
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.utils.mocks.Mock
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.rules.TestName

abstract class AssetUITest(val group: String? = null) {

    @get:Rule
    val name = TestName()

    @get:Rule
    val rule = activityScenarioRule<MainActivity>()

    open fun getActivityRule() = rule

    protected lateinit var viewModel: MainViewModel

    protected lateinit var playerViewModel: DemoPlayerViewModel
    protected val player get() = playerViewModel.player

    protected val currentState: PlayerFlowState? get() = playerViewModel.playerFlowState.value

    protected val mocks get() = viewModel.mocks.filter {
        group == null || group == it.group
    }

    @Before
    fun before() {
        Intents.init()
        getActivityRule().scenario.onActivity {
            viewModel = it.viewModel
        }
    }

    @After
    fun after() {
        Intents.release()
    }

    fun launchMock() {
        launchMock(name.methodName)
    }

    fun launchMock(name: String) {
        launchMock(
            mocks.find { it.name == name || it.name == "$group-$name" }
                ?: throw IllegalArgumentException("$name not found in mocks: ${mocks.map { "${it.group}/${it.name}" }}"),
        )
    }

    fun launchMock(mock: Mock<*>) {
        viewModel.launch(mock)

        getActivityRule().scenario.onActivity {
            playerViewModel = it.currentPlayer?.playerViewModel as? DemoPlayerViewModel
                ?: throw IllegalStateException("player not found")
        }
    }
}
