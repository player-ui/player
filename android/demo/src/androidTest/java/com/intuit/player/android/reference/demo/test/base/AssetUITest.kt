package com.intuit.player.android.reference.demo.test.base

import androidx.test.espresso.intent.Intents
import androidx.test.ext.junit.rules.activityScenarioRule
import com.intuit.player.android.reference.demo.lifecycle.DemoPlayerViewModel
import com.intuit.player.android.reference.demo.ui.main.MainActivity
import com.intuit.player.android.reference.demo.ui.main.MainViewModel
import com.intuit.player.jvm.core.player.state.PlayerFlowState
import com.intuit.player.jvm.utils.mocks.Mock
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.rules.TestName

abstract class AssetUITest(val group: String? = null) : ApplitoolsTest() {

    @get:Rule
    val name = TestName()

    @get:Rule
    val rule = activityScenarioRule<MainActivity>()

    protected lateinit var viewModel: MainViewModel

    protected lateinit var playerViewModel: DemoPlayerViewModel

    protected val currentState: PlayerFlowState? get() = playerViewModel.playerFlowState.value

    protected val mocks get() = viewModel.mocks.filter {
        group == null || group == it.group
    }

    @Before
    fun before() {
        Intents.init()
        rule.scenario.onActivity {
            viewModel = it.viewModel
        }
    }

    @After
    fun after() {
        // eyes?.takeIf { it.isOpen }?.run {
        //     checkWindow("done")
        //     close()
        // }
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

        rule.scenario.onActivity {
            playerViewModel = it.currentPlayer?.playerViewModel as? DemoPlayerViewModel
                ?: throw IllegalStateException("player not found")
        }

        //eyes?.open("Android Reference Assets Demo", "${mock.group}/${mock.name}/${name.methodName}")
        //eyes?.checkPlayer("init")
    }
}
