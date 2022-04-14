package com.intuit.player.jvm.j2v8.extensions

import com.eclipsesource.v8.V8
import com.eclipsesource.v8.V8Function
import com.intuit.player.jvm.j2v8.V8Function
import com.intuit.player.jvm.j2v8.base.AutoAcquireJ2V8Test
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

internal class InvokeTest : AutoAcquireJ2V8Test() {

    @Test
    fun `test V8Function vararg invoke`() {
        val func = v8.executeObjectScript("""(function(a,b){return a+b})""") as V8Function
        assertEquals(4, func.call(v8, format.args(2, 2)))
        assertEquals(4, func.invoke(format, 2, 2))
    }

    @Test
    fun `test V8Function creation helper`() {
        assertEquals(V8.getUndefined(), V8Function(format) { Unit }())
        assertEquals(4, V8Function(format) { 2 + 2 }())
    }
}
