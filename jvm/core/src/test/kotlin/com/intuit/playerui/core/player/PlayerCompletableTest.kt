package com.intuit.playerui.core.player

import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.utils.test.runBlockingTest
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import kotlinx.coroutines.withTimeout
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith

@ExtendWith(MockKExtension::class)
internal class PlayerCompletableTest {
    lateinit var playerCompletable: PlayerCompletable

    @MockK lateinit var node: Node

    @BeforeEach
    fun playerCompletble() {
        playerCompletable = PlayerCompletable(node)
    }

    @Test
    fun asFlow() = runBlockingTest {
        withTimeout(10000) {
            assertNotNull(playerCompletable.asFlow())
        }
    }
}
