package com.intuit.playerui.android.lifecycle

import android.util.Level
import android.util.clearLogs
import com.intuit.playerui.android.extensions.CoroutineTestDispatcherExtension
import com.intuit.playerui.android.utils.SimpleAsset
import com.intuit.playerui.core.bridge.PlayerRuntimeException
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.managed.AsyncFlowIterator
import com.intuit.playerui.core.player.state.CompletedState
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.PlayerFlowState
import com.intuit.playerui.core.player.state.ReleasedState
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.test.TestCoroutineScope
import kotlinx.coroutines.withTimeout
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith

@ExtendWith(MockKExtension::class)
@ExtendWith(CoroutineTestDispatcherExtension::class)
internal class PlayerViewModelTest {

    private val validFlow = "{\"id\": \"id\",\"navigation\": {\"BEGIN\": \"FLOW_1\",\"FLOW_1\": {\"startState\": \"END_Done\",\"END_Done\": {\"state_type\": \"END\",\"outcome\": \"done\"}}}}"

    private val invalidFlow = "{\"id\": \"id\",\"navigation\": {\"BEGIN\": \"FLOW\",\"FLOW_1\": {\"startState\": \"END_Done\",\"END_Done\": {\"state_type\": \"END\",\"outcome\": \"done\"}}}}"

    @MockK lateinit var flowIterator: AsyncFlowIterator

    @MockK lateinit var runtime: Runtime<*>

    lateinit var viewModel: PlayerViewModel

    // TODO: This likely doesn't need to happen if we can inject a test dispatcher effectively
    private suspend fun <T> suspendUntilCondition(timeout: Long = 5000, getValue: () -> T, condition: (T) -> Boolean, messageSupplier: (T) -> String): T = try {
        withTimeout(timeout) {
            var result: T = getValue()
            while (!condition(result)) {
                delay(50)
                result = getValue()
            }

            result
        }
    } catch (exception: TimeoutCancellationException) {
        throw AssertionError(messageSupplier(getValue()))
    }

    private suspend fun Level.assertLogged(value: String, times: Int = 1, timeout: Long = 5000) {
        suspendUntilCondition(
            timeout,
            this::getLogs,
            { it.filter { it == value }.size == times },
            { "$this log not captured: $value\nin ${getLogs()}" },
        )
    }

    private suspend inline fun <reified T : PlayerFlowState> assertPlayerState(timeout: Long = 5000): T = suspendUntilCondition(
        timeout,
        viewModel.player::state,
        { it is T },
        { "Expected Player state to eventually be ${T::class}, but is ${viewModel.player.state}" },
    ) as T

    private suspend inline fun <reified T : ManagedPlayerState> assertManagedPlayerState(timeout: Long = 5000): T = suspendUntilCondition(
        timeout,
        viewModel.state::value,
        { it is T },
        { "Expected Managed Player state to eventually be ${T::class}, but is ${viewModel.state.value}" },
    ) as T

    @BeforeEach
    fun setup() {
        viewModel = PlayerViewModel(flowIterator)
        every { runtime.scope } returns TestCoroutineScope()
        // TODO: Change to StandardTestDispatcher
        every { runtime.scope } returns CoroutineScope(Dispatchers.Default)
        coEvery { flowIterator.terminate() } returns Unit
    }

    @AfterEach
    fun tearDown() = clearLogs()

    @Test
    fun `test factory`() {
        assertNotNull(
            PlayerViewModel.Factory(flowIterator) {
                PlayerViewModel(it)
            }.create(PlayerViewModel::class.java),
        )
    }

    @Test
    fun `AndroidPlayer isn't null`() {
        assertNotNull(viewModel.player)
    }

    @Test
    fun `apply android player onUpdate`() = runBlocking {
        coEvery { flowIterator.next(any()) } returns SimpleAsset.sampleFlow.toString()
        viewModel.start()
        coVerify(exactly = 1) { flowIterator.next(any()) }
        assertPlayerState<InProgressState>()
        Level.Warn.assertLogged("WARN: AndroidPlayer: Warning in flow: simple-asset of type simple is not registered")
    }

    @Test
    fun `apply android player state hook tap`() = runBlocking {
        coEvery { flowIterator.next(any()) } returns validFlow andThen invalidFlow
        viewModel.start()
        coVerify(exactly = 1) { flowIterator.next(null) }
        coVerify(exactly = 1) { flowIterator.next(any()) }
        assertEquals("Error: No flow defined for: FLOW", assertPlayerState<ErrorState>().error.message)
    }

    @Test
    fun `start calls next on manager`() {
        coEvery { flowIterator.next(any()) } returns SimpleAsset.sampleFlow.toString()
        viewModel.start()
        coVerify(exactly = 1) { flowIterator.next(null) }
    }

    @Test
    fun `start eventually finishes if iterator does not return a new flow`() = runBlocking {
        coEvery { flowIterator.next(any()) } returns null
        viewModel.start()
        val doneState = assertManagedPlayerState<ManagedPlayerState.Done>()
        assertEquals(ManagedPlayerState.Done(null), doneState)
    }

    @Test
    fun `start happy path`() = runBlocking {
        coEvery { flowIterator.next(any()) } returns validFlow andThen null
        viewModel.start()
        assertPlayerState<CompletedState>()
        Level.Info.assertLogged("INFO: AndroidPlayer: Flow completed successfully!, {state_type=END, outcome=done}")
    }

    @Test
    fun `start error path`() = runBlocking {
        coEvery { flowIterator.next(any()) } returns invalidFlow
        viewModel.start()
        assertPlayerState<ErrorState>()
        Level.Error.assertLogged("ERROR: AndroidPlayer: Error in Flow!, {}")
        Level.Error.assertLogged("ERROR: AndroidPlayer: Something went wrong: No flow defined for: FLOW")
    }

    @Test
    fun `start will emit error state if iterator errors out`() = runBlocking {
        val exception = Exception("oh no")
        coEvery { flowIterator.next(any()) } throws exception
        viewModel.start()
        val errorState = assertManagedPlayerState<ManagedPlayerState.Error>()
        assertEquals("oh no", errorState.exception.message)
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
    fun `onCleared releases player`() = runBlocking {
        coEvery { flowIterator.terminate() } returns Unit
        viewModel.apply(runtime)
        viewModel.player.start(SimpleAsset.sampleFlow.toString())
        viewModel.onCleared()
        assertPlayerState<ReleasedState>()
        assertTrue(
            assertThrows<PlayerRuntimeException> {
                viewModel.player.start(SimpleAsset.sampleFlow.toString())
            }.message!!.endsWith("Runtime object has been released!"),
        )
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
    fun `test fail`() = runBlocking {
        val exception = Exception("oh no")
        coEvery { flowIterator.next(any()) } returns SimpleAsset.sampleFlow.toString()
        viewModel.start()

        assertPlayerState<InProgressState>()

        viewModel.fail("extension fail", exception)
        assertEquals("extension fail", assertPlayerState<ErrorState>().error.message)
    }

    @Test
    fun `retry should start player if not started`() {
        coEvery { flowIterator.next(any()) } returns SimpleAsset.sampleFlow.toString()
        viewModel.retry()
        coVerify(exactly = 1) { flowIterator.next(null) }
    }

    @Test
    fun `retry should call manager next if it's running`() = runBlocking {
        coEvery { flowIterator.next(any()) } returns SimpleAsset.sampleFlow.toString()
        viewModel.start()

        assertManagedPlayerState<ManagedPlayerState.Running>()

        viewModel.retry()
        coVerify(exactly = 2) { flowIterator.next(null) }
    }

    @Test
    fun `retry should call manager next if it's in error state`() = runBlocking {
        val exception = Exception("oh no")
        coEvery { flowIterator.next(any()) } throws exception
        viewModel.start()

        assertManagedPlayerState<ManagedPlayerState.Error>()

        viewModel.retry()
        coVerify(exactly = 2) { flowIterator.next(null) }
    }

    @Test
    fun `view model can be cleared successfully if player is never used`() = runBlocking {
        val exception = Exception("oh no")
        coEvery { flowIterator.next(any()) } throws exception
        viewModel.start()

        assertManagedPlayerState<ManagedPlayerState.Error>()

        // ensures safe handling during cleanup when player is never instantiated
        viewModel.onCleared()
    }
}
