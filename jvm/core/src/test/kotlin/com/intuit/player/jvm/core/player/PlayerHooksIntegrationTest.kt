package com.intuit.player.jvm.core.player

import com.intuit.player.jvm.core.player.state.CompletedState
import com.intuit.player.jvm.core.player.state.inProgressState
import com.intuit.player.jvm.utils.test.PlayerTest
import com.intuit.player.jvm.utils.test.runBlockingTest
import com.intuit.player.jvm.utils.test.simpleFlowString
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.suspendCancellableCoroutine
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

@ExperimentalCoroutinesApi
internal class PlayerHooksIntegrationTest : PlayerTest() {

    @Test fun `test hook integration`() = runBlockingTest {
        var didTapSuccessfully = false

        player.hooks.viewController.tap { viewController ->
            viewController?.hooks?.view?.tap { view ->
                view?.hooks?.onUpdate?.tap { _ ->
                    didTapSuccessfully = true
                }
            }
        }
        suspendCancellableCoroutine<Result<CompletedState>> { cont ->
            player.start(simpleFlowString).onComplete {
                cont.resume(it) {}
            }
            player.inProgressState!!.transition("Next")
        }

        assertTrue(didTapSuccessfully)
    }
}
