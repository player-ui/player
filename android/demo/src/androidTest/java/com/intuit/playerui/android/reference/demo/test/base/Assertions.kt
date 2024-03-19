package com.intuit.playerui.android.reference.demo.test.base

import android.view.View
import com.intuit.playerui.android.asset.RenderableAsset
import com.intuit.playerui.core.player.state.PlayerFlowState
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
    shouldBeInstanceOf<T>(this)
    assertions()
    return this
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
