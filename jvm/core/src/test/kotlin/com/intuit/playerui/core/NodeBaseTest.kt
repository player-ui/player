package com.intuit.playerui.core

import com.intuit.playerui.core.bridge.Node
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import org.junit.jupiter.api.extension.ExtendWith

@ExtendWith(MockKExtension::class)
internal abstract class NodeBaseTest {
    @MockK
    lateinit var node: Node
}
