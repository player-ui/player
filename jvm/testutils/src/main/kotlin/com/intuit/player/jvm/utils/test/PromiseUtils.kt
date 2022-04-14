package com.intuit.player.jvm.utils.test

import com.intuit.player.jvm.core.bridge.Promise
import com.intuit.player.jvm.core.bridge.then
import kotlinx.serialization.DeserializationStrategy
import org.junit.jupiter.api.Assertions

public interface PromiseUtils {

    public val thenChain: MutableList<Any?>
    public val catchChain: MutableList<Any?>

    public fun assertThen(vararg expected: Any?): Unit = assertChain(
        thenChain,
        *expected
    )
    public fun assertCatch(vararg expected: Any?): Unit = assertChain(
        catchChain.map {
            when (it) {
                is Throwable -> it.message
                else -> it
            }
        },
        *expected
    )
    public fun assertChain(chain: List<Any?>, vararg expected: Any?): Unit =
        Assertions.assertEquals(expected.asList(), chain)

    public val Promise.thenRecord: Promise get() = thenRecord()
    public fun Promise.thenRecord(): Promise = thenRecord(thenChain)
    public fun <T : Any> Promise.thenRecord(deserializer: DeserializationStrategy<T>): Promise = thenRecord(deserializer, thenChain)
    public fun Promise.thenRecord(list: MutableList<Any?>): Promise = then { it: Any? -> list.add(it) }
    public fun <T : Any> Promise.thenRecord(deserializer: DeserializationStrategy<T>, list: MutableList<Any?>): Promise = then(deserializer) { list.add(it) }

    public val Promise.catchRecord: Promise get() = catchRecord()
    public fun Promise.catchRecord(): Promise = catchRecord(catchChain)
    public fun Promise.catchRecord(list: MutableList<Any?>): Promise = catch { list.add(it) }
}
