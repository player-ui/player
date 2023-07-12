package com.intuit.player.android.lifecycle

import android.util.*
import android.util.clearLogs
import android.util.e
import android.util.i
import android.util.w
import com.intuit.player.android.utils.SimpleAsset
import com.intuit.player.jvm.core.bridge.PlayerRuntimeException
import com.intuit.player.jvm.core.bridge.runtime.Runtime
import com.intuit.player.jvm.core.managed.AsyncFlowIterator
import com.intuit.player.jvm.core.player.state.CompletedState
import com.intuit.player.jvm.core.player.state.ErrorState
import com.intuit.player.jvm.core.player.state.InProgressState
import com.intuit.player.jvm.core.player.state.completedState
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith

@OptIn(ExperimentalCoroutinesApi::class)
@ExtendWith(MockKExtension::class)
internal class PlayerViewModelTest {

    private val validFlow = "{\"id\": \"id\",\"navigation\": {\"BEGIN\": \"FLOW_1\",\"FLOW_1\": {\"startState\": \"END_Done\",\"END_Done\": {\"state_type\": \"END\",\"outcome\": \"done\"}}}}"

    private val invalidFlow = "{\"id\": \"id\",\"navigation\": {\"BEGIN\": \"FLOW\",\"FLOW_1\": {\"startState\": \"END_Done\",\"END_Done\": {\"state_type\": \"END\",\"outcome\": \"done\"}}}}"

    @MockK lateinit var flowIterator: AsyncFlowIterator
    @MockK lateinit var runtime: Runtime<*>

    lateinit var viewModel: PlayerViewModel

    @BeforeEach
    fun setup() {
        viewModel = PlayerViewModel(flowIterator)
        every { runtime.scope } returns TestCoroutineScope()
    }

    @AfterEach
    fun tearDown() = clearLogs()

    @Test
    fun `test factory`() {
        assertNotNull(
            PlayerViewModel.Factory(flowIterator) {
                PlayerViewModel(it)
            }.create(PlayerViewModel::class.java)
        )
    }

    @Test
    fun `AndroidPlayer isn't null`() {
        assertNotNull(viewModel.player)
    }

    @Test
    fun `apply android player onUpdate`() {
        coEvery { flowIterator.next(any()) } returns SimpleAsset.sampleFlow.toString()
        viewModel.start()
        assertTrue(viewModel.player.state is InProgressState)
        assertTrue(
            w.filter {
                it == "WARN: AndroidPlayer: Warning in flow: simple-asset of type simple is not registered"
            }.size == 1
        )
    }

    @Test
    fun `apply android player state hook tap`() {
        coEvery { flowIterator.next(any()) } returns validFlow andThen invalidFlow
        viewModel.start()
        coVerify(exactly = 1) { flowIterator.next(null) }
        coVerify(exactly = 1) { flowIterator.next(viewModel.player.completedState) }
        assertTrue(viewModel.player.state is ErrorState)
    }

    @Test
    fun `start calls next on manager`() {
        coEvery { flowIterator.next(any()) } returns SimpleAsset.sampleFlow.toString()
        viewModel.start()
        coVerify(exactly = 1) { flowIterator.next(null) }
    }

    @Test
    fun `start eventually finishes if iterator does not return a new flow`() {
        coEvery { flowIterator.next(any()) } returns null
        viewModel.start()
        assertEquals(ManagedPlayerState.Done(viewModel.player.completedState), viewModel.state.value)
    }

    @Test
    fun `start happy path`() {
        coEvery { flowIterator.next(any()) } returns validFlow andThen null
        viewModel.start()
        assertTrue(viewModel.player.state is CompletedState)
        assertTrue(
            i.filter {
                it == "INFO: AndroidPlayer: Flow completed successfully!, {state_type=END, outcome=done}"
            }.size == 1
        )
    }

    @Test
    fun `start error path`() {
        coEvery { flowIterator.next(any()) } returns invalidFlow
        viewModel.start()
        assertTrue(
            e.filter {
                it == "ERROR: AndroidPlayer: Error in Flow!, {}"
            }.size == 1
        )
        assertTrue(
            e.filter {
                it == "ERROR: AndroidPlayer: Something went wrong: No flow defined for: FLOW"
            }.size == 1
        )
    }

    @Test
    fun `start will emit error state if iterator errors out`() {
        val exception = Exception("oh no")
        coEvery { flowIterator.next(any()) } throws exception
        viewModel.start()
        assertEquals(ManagedPlayerState.Error(exception), viewModel.state.value)
    }

    @Test
    fun `recycle calls into AndroidPlayer recycle`() {
        var recycled = false
        viewModel.player.hooks.recycle.tap("releaseTest") {
            recycled = true
        }
        viewModel.recycle()
        assertTrue(recycled)
    }

    @Test
    fun `onCleared releases player`() {
        coEvery { flowIterator.terminate() } returns Unit
        viewModel.apply(runtime)
        viewModel.onCleared()
        assertThrows<PlayerRuntimeException> {
            viewModel.player.start(SimpleAsset.sampleFlow.toString())
        }
    }

    @Test
    fun `release clears player cache and releases runtime`() {
        var released = false
        viewModel.player.hooks.release.tap("releaseTest") {
            released = true
        }
        coEvery { flowIterator.next(null) } returns SimpleAsset.sampleFlow.toString()
        viewModel.release()
        assertThrows<PlayerRuntimeException> {
            viewModel.player.start(SimpleAsset.sampleFlow.toString())
        }
        assertTrue(released)
    }

    @Test
    fun `test fail`() {
        val exception = Exception("oh no")
        coEvery { flowIterator.next(any()) } returns SimpleAsset.sampleFlow.toString()
        viewModel.start()

        assertTrue(viewModel.player.state is InProgressState)

        viewModel.fail("extension fail", exception)
        assertTrue(viewModel.player.state is ErrorState)
        assertEquals("extension fail", (viewModel.player.state as ErrorState).error.message)
    }

    @Test
    fun `retry should start player if not started`() {
        coEvery { flowIterator.next(any()) } returns SimpleAsset.sampleFlow.toString()
        viewModel.retry()
        coVerify(exactly = 1) { flowIterator.next(null) }
    }

    @Test
    fun `retry should call manager next if it's running`() {
        coEvery { flowIterator.next(any()) } returns SimpleAsset.sampleFlow.toString()
        viewModel.start()

        assertTrue(viewModel.state.value is ManagedPlayerState.Running)

        viewModel.retry()
        coVerify(exactly = 2) { flowIterator.next(null) }
    }

    @Test
    fun `retry should call manager next if it's in error state`() {
        val exception = Exception("oh no")
        coEvery { flowIterator.next(any()) } throws exception
        viewModel.start()

        assertTrue(viewModel.state.value is ManagedPlayerState.Error)

        viewModel.retry()
        coVerify(exactly = 2) { flowIterator.next(null) }
    }
}
