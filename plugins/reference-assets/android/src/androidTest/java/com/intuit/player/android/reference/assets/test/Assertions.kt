package com.intuit.player.android.reference.assets.test

import android.view.View
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.android.asset.SuspendableAsset
import com.intuit.player.jvm.core.player.state.PlayerFlowState
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertTrue
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.contract

@OptIn(ExperimentalContracts::class)
inline fun <reified T : RenderableAsset> Any?.shouldBeAsset(
    block: T.() -> Unit = {},
): T {
    shouldBeInstanceOf<T>(this)
    block()
    return this
}

@OptIn(ExperimentalContracts::class)
inline fun <reified T : View> Any?.shouldBeView(assertions: T.() -> Unit = {}): T {
    val view = if (T::class != SuspendableAsset.AsyncViewStub::class && this is SuspendableAsset.AsyncViewStub) {
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
inline fun <reified T : PlayerFlowState> PlayerFlowState?.shouldBePlayerState(assertions: T.() -> Unit = {}): T {
    shouldBeInstanceOf<T>(this)
    assertions()
    return this
}

@ExperimentalContracts
inline fun <reified T> shouldBeInstanceOf(
    `this`: Any?,
) {
    contract {
        returns() implies (`this` is T)
    }

    assertTrue("${`this`?.run { `this`::class.java.simpleName } ?: "null"} isn't an instance of ${T::class.java.simpleName}", `this` is T)
}
