package com.intuit.playerui.android.testutils.asset

import android.view.View
import com.intuit.playerui.android.asset.DecodableAsset
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.state.PlayerFlowState
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeout
import org.junit.Assert.assertTrue
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.contract

@OptIn(ExperimentalContracts::class)
public inline fun <reified T : RenderableAsset> Any?.shouldBeAsset(
    block: T.() -> Unit = {},
): T {
    shouldBeInstanceOf<T>(this)
    block()
    return this
}

@OptIn(ExperimentalContracts::class)
public inline fun <reified T : View> Any?.shouldBeView(assertions: T.() -> Unit = {}): T {
    val view = if (T::class != DecodableAsset.AsyncViewStub::class && this is DecodableAsset.AsyncViewStub) {
        runBlocking {
            awaitView()
        }
    } else {
        this
    }
    shouldBeInstanceOf<T>(view)
    view.assertions()
    return view
}

@OptIn(ExperimentalContracts::class)
public inline fun <reified T : PlayerFlowState> Player?.shouldBeAtState(assertions: T.() -> Unit = {}): T {
    runBlocking {
        waitUntilState<T>(this@shouldBeAtState?.state)
    }
    shouldBeInstanceOf<T>(this?.state)
    assertions.invoke(this?.state as T)
    return this.state as T
}

suspend inline fun <reified T : PlayerFlowState> waitUntilState(state: PlayerFlowState?) {
    withTimeout(10000) {
        suspendCancellableCoroutine { continuation ->
            if (state !is T) runBlocking { delay(5) }
            continuation.resume(Unit) {}
        }
    }
}

@ExperimentalContracts
public inline fun <reified T> shouldBeInstanceOf(
    `this`: Any?,
) {
    contract {
        returns() implies (`this` is T)
    }

    assertTrue("${`this`?.run { `this`::class.java.simpleName } ?: "null"} isn't an instance of ${T::class.java.simpleName}", `this` is T)
}
