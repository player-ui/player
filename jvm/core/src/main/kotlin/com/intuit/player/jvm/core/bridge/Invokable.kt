package com.intuit.player.jvm.core.bridge

import kotlin.jvm.functions.FunctionN

public fun <R> Invokable(block: (args: Array<out Any?>) -> R): Invokable<R> = object : Invokable<R> {
    override fun invoke(vararg args: Any?): R {
        return block(args)
    }
}

/** [Function] extension that provides loosely-typed vararg [invoke] signature */
public interface Invokable<R> : Function<R>, Function0<R>, Function1<Any?, R>, Function2<Any?, Any?, R>, Function3<Any?, Any?, Any?, R>, Function4<Any?, Any?, Any?, Any?, R>, Function5<Any?, Any?, Any?, Any?, Any?, R>, Function6<Any?, Any?, Any?, Any?, Any?, Any?, R>, Function7<Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function8<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function9<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function10<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function11<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function12<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function13<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function14<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function15<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function16<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function17<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function18<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function19<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function20<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function21<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R>, Function22<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
    public operator fun invoke(vararg args: Any?): R
    override fun invoke(): R = invoke(*arrayOf())
    override fun invoke(p1: Any?): R = invoke(*arrayOf(p1))
    override fun invoke(p1: Any?, p2: Any?): R = invoke(*arrayOf(p1, p2))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?): R = invoke(*arrayOf(p1, p2, p3))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?): R = invoke(*arrayOf(p1, p2, p3, p4))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?, p17: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?, p17: Any?, p18: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?, p17: Any?, p18: Any?, p19: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?, p17: Any?, p18: Any?, p19: Any?, p20: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?, p17: Any?, p18: Any?, p19: Any?, p20: Any?, p21: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, p21))
    override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?, p17: Any?, p18: Any?, p19: Any?, p20: Any?, p21: Any?, p22: Any?): R = invoke(*arrayOf(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, p21, p22))
}

/** Extension to convert an [Invokable] to some [functionTypeName] */
@Deprecated(
    "Invokable extend Functions automatically",
    level = DeprecationLevel.ERROR
)
public fun <R> Invokable<R>.toFunction(functionTypeName: String): Function<R> = when (functionTypeName) {
    "Function0" -> object : Function0<R> {
        override fun invoke() = this@toFunction()
    }
    "Function1" -> object : Function1<Any?, R> {
        override fun invoke(p1: Any?) = this@toFunction(p1)
    }
    "Function2" -> object : Function2<Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?) = this@toFunction(p1, p2)
    }
    "Function3" -> object : Function3<Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?) = this@toFunction(p1, p2, p3)
    }
    "Function4" -> object : Function4<Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?) = this@toFunction(p1, p2, p3, p4)
    }
    "Function5" -> object : Function5<Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?) = this@toFunction(p1, p2, p3, p4, p5)
    }
    "Function6" -> object : Function6<Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6)
    }
    "Function7" -> object : Function7<Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7)
    }
    "Function8" -> object : Function8<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8)
    }
    "Function9" -> object : Function9<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9)
    }
    "Function10" -> object : Function10<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10)
    }
    "Function11" -> object : Function11<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11)
    }
    "Function12" -> object : Function12<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12)
    }
    "Function13" -> object : Function13<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13)
    }
    "Function14" -> object : Function14<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14)
    }
    "Function15" -> object : Function15<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15)
    }
    "Function16" -> object : Function16<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16)
    }
    "Function17" -> object : Function17<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?, p17: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17)
    }
    "Function18" -> object : Function18<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?, p17: Any?, p18: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18)
    }
    "Function19" -> object : Function19<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?, p17: Any?, p18: Any?, p19: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19)
    }
    "Function20" -> object : Function20<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?, p17: Any?, p18: Any?, p19: Any?, p20: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20)
    }
    "Function21" -> object : Function21<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?, p17: Any?, p18: Any?, p19: Any?, p20: Any?, p21: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, p21)
    }
    "Function22" -> object : Function22<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, R> {
        override fun invoke(p1: Any?, p2: Any?, p3: Any?, p4: Any?, p5: Any?, p6: Any?, p7: Any?, p8: Any?, p9: Any?, p10: Any?, p11: Any?, p12: Any?, p13: Any?, p14: Any?, p15: Any?, p16: Any?, p17: Any?, p18: Any?, p19: Any?, p20: Any?, p21: Any?, p22: Any?) = this@toFunction(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, p21, p22)
    }
    "FunctionN" -> object : FunctionN<R> {
        override fun invoke(vararg args: Any?) = this@toFunction(*args)
        override val arity: Int get() = Integer.MAX_VALUE
    }
    else -> throw IllegalArgumentException("$functionTypeName is not a valid function type")
}

/**
 * Dynamically invoke [Function] with variable length args. Determines which specific [Function]
 * interface [this] implements and is invoked using the parameters from [args]. Instead of requiring
 * exact parameters, this will follow the JS way and pass null when the parameter wasn't defined.
 * This does not solve for type safety though if types do not match.
 *
 * Ugly solution, awaiting advice:
 * https://discuss.kotlinlang.org/t/dynamically-invoke-function-r/17242
 */
@Suppress("UNCHECKED_CAST")
public fun Function<*>.invokeVararg(vararg args: Any?): Any? = when (this) {
    is Invokable -> this(*args)
    is Function0 -> this()
    is Function1<*, *> -> (this as Function1<Any?, *>)(args.getOrNull(0))
    is Function2<*, *, *> -> (this as Function2<Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1))
    is Function3<*, *, *, *> -> (this as Function3<Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2))
    is Function4<*, *, *, *, *> -> (this as Function4<Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3))
    is Function5<*, *, *, *, *, *> -> (this as Function5<Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4))
    is Function6<*, *, *, *, *, *, *> -> (this as Function6<Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5))
    is Function7<*, *, *, *, *, *, *, *> -> (this as Function7<Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6))
    is Function8<*, *, *, *, *, *, *, *, *> -> (this as Function8<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7))
    is Function9<*, *, *, *, *, *, *, *, *, *> -> (this as Function9<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8))
    is Function10<*, *, *, *, *, *, *, *, *, *, *> -> (this as Function10<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9))
    is Function11<*, *, *, *, *, *, *, *, *, *, *, *> -> (this as Function11<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9), args.getOrNull(10))
    is Function12<*, *, *, *, *, *, *, *, *, *, *, *, *> -> (this as Function12<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9), args.getOrNull(10), args.getOrNull(11))
    is Function13<*, *, *, *, *, *, *, *, *, *, *, *, *, *> -> (this as Function13<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9), args.getOrNull(10), args.getOrNull(11), args.getOrNull(12))
    is Function14<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *> -> (this as Function14<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9), args.getOrNull(10), args.getOrNull(11), args.getOrNull(12), args.getOrNull(13))
    is Function15<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *> -> (this as Function15<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9), args.getOrNull(10), args.getOrNull(11), args.getOrNull(12), args.getOrNull(13), args.getOrNull(14))
    is Function16<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *> -> (this as Function16<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9), args.getOrNull(10), args.getOrNull(11), args.getOrNull(12), args.getOrNull(13), args.getOrNull(14), args.getOrNull(15))
    is Function17<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *> -> (this as Function17<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9), args.getOrNull(10), args.getOrNull(11), args.getOrNull(12), args.getOrNull(13), args.getOrNull(14), args.getOrNull(15), args.getOrNull(16))
    is Function18<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *> -> (this as Function18<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9), args.getOrNull(10), args.getOrNull(11), args.getOrNull(12), args.getOrNull(13), args.getOrNull(14), args.getOrNull(15), args.getOrNull(16), args.getOrNull(17))
    is Function19<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *> -> (this as Function19<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9), args.getOrNull(10), args.getOrNull(11), args.getOrNull(12), args.getOrNull(13), args.getOrNull(14), args.getOrNull(15), args.getOrNull(16), args.getOrNull(17), args.getOrNull(18))
    is Function20<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *> -> (this as Function20<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9), args.getOrNull(10), args.getOrNull(11), args.getOrNull(12), args.getOrNull(13), args.getOrNull(14), args.getOrNull(15), args.getOrNull(16), args.getOrNull(17), args.getOrNull(18), args.getOrNull(19))
    is Function21<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *> -> (this as Function21<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9), args.getOrNull(10), args.getOrNull(11), args.getOrNull(12), args.getOrNull(13), args.getOrNull(14), args.getOrNull(15), args.getOrNull(16), args.getOrNull(17), args.getOrNull(18), args.getOrNull(19), args.getOrNull(20))
    is Function22<*, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *, *> -> (this as Function22<Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, Any?, *>)(args.getOrNull(0), args.getOrNull(1), args.getOrNull(2), args.getOrNull(3), args.getOrNull(4), args.getOrNull(5), args.getOrNull(6), args.getOrNull(7), args.getOrNull(8), args.getOrNull(9), args.getOrNull(10), args.getOrNull(11), args.getOrNull(12), args.getOrNull(13), args.getOrNull(14), args.getOrNull(15), args.getOrNull(16), args.getOrNull(17), args.getOrNull(18), args.getOrNull(19), args.getOrNull(20), args.getOrNull(21))
    is FunctionN -> this(*args)
    else -> throw IllegalArgumentException("this (${this::class}) does not implement any known function interface")
}

// TODO: This was the original implementation for `invokeVararg` but didn't work b/c the Kotlin reflection
//  implementation wasn't complete. Should retest at a later date.
// operator fun <R> Function<R>.invoke(instance: Any, vararg args: Any?) =
//     this::class.java.methods.find { it.name == "invoke" }!!(instance, args)
