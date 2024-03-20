package com.intuit.playerui.core.bridge

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test

internal class InvokableTest {

    private fun generateVarargs(n: Int) = (0 until n).map { 1 }.toTypedArray()

    @Test
    fun `test invokeVararg all the arities`() {
        assertEquals(0, { 0 }.invokeVararg(*generateVarargs(0)))
        assertEquals(1, { a: Int -> 0 + a }.invokeVararg(*generateVarargs(1)))
        assertEquals(2, { a: Int, b: Int -> 0 + a + b }.invokeVararg(*generateVarargs(2)))
        assertEquals(3, { a: Int, b: Int, c: Int -> 0 + a + b + c }.invokeVararg(*generateVarargs(3)))
        assertEquals(4, { a: Int, b: Int, c: Int, d: Int -> 0 + a + b + c + d }.invokeVararg(*generateVarargs(4)))
        assertEquals(5, { a: Int, b: Int, c: Int, d: Int, e: Int -> 0 + a + b + c + d + e }.invokeVararg(*generateVarargs(5)))
        assertEquals(6, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int -> 0 + a + b + c + d + e + f }.invokeVararg(*generateVarargs(6)))
        assertEquals(7, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int -> 0 + a + b + c + d + e + f + g }.invokeVararg(*generateVarargs(7)))
        assertEquals(8, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int -> 0 + a + b + c + d + e + f + g + h }.invokeVararg(*generateVarargs(8)))
        assertEquals(9, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int -> 0 + a + b + c + d + e + f + g + h + i }.invokeVararg(*generateVarargs(9)))
        assertEquals(10, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int -> 0 + a + b + c + d + e + f + g + h + i + j }.invokeVararg(*generateVarargs(10)))
        assertEquals(11, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k }.invokeVararg(*generateVarargs(11)))
        assertEquals(12, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int, l: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k + l }.invokeVararg(*generateVarargs(12)))
        assertEquals(13, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int, l: Int, m: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k + l + m }.invokeVararg(*generateVarargs(13)))
        assertEquals(14, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int, l: Int, m: Int, n: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k + l + m + n }.invokeVararg(*generateVarargs(14)))
        assertEquals(15, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int, l: Int, m: Int, n: Int, o: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k + l + m + n + o }.invokeVararg(*generateVarargs(15)))
        assertEquals(16, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int, l: Int, m: Int, n: Int, o: Int, p: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p }.invokeVararg(*generateVarargs(16)))
        assertEquals(17, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int, l: Int, m: Int, n: Int, o: Int, p: Int, q: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q }.invokeVararg(*generateVarargs(17)))
        assertEquals(18, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int, l: Int, m: Int, n: Int, o: Int, p: Int, q: Int, r: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r }.invokeVararg(*generateVarargs(18)))
        assertEquals(19, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int, l: Int, m: Int, n: Int, o: Int, p: Int, q: Int, r: Int, s: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r + s }.invokeVararg(*generateVarargs(19)))
        assertEquals(20, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int, l: Int, m: Int, n: Int, o: Int, p: Int, q: Int, r: Int, s: Int, t: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r + s + t }.invokeVararg(*generateVarargs(20)))
        assertEquals(21, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int, l: Int, m: Int, n: Int, o: Int, p: Int, q: Int, r: Int, s: Int, t: Int, u: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r + s + t + u }.invokeVararg(*generateVarargs(21)))
        assertEquals(22, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int, l: Int, m: Int, n: Int, o: Int, p: Int, q: Int, r: Int, s: Int, t: Int, u: Int, v: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r + s + t + u + v }.invokeVararg(*generateVarargs(22)))
        assertEquals(23, { a: Int, b: Int, c: Int, d: Int, e: Int, f: Int, g: Int, h: Int, i: Int, j: Int, k: Int, l: Int, m: Int, n: Int, o: Int, p: Int, q: Int, r: Int, s: Int, t: Int, u: Int, v: Int, w: Int -> 0 + a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r + s + t + u + v + w }.invokeVararg(*generateVarargs(23)))
    }

    @Test
    fun `test invokeVararg error case`() {
        val func = object : Function<Int> {}
        assertThrows(IllegalArgumentException::class.java) { func.invokeVararg() }
    }
}
