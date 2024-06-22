package com.intuit.playerui.jsi

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip

// TODO: Do we just tie these to specific runtimes? I feel like that'd help w/ ergonomics and ensuring values are used with the same runtime context

// TODO: For serializing into JS objects, can we just make a HostObject?

/** FBJNI wrapper for accessing facebook::jsi::Value APIs */
public class Value private constructor(@DoNotStrip private val mHybridData: HybridData) {

    public external fun isUndefined(): Boolean
    public external fun isNull(): Boolean
    public external fun isBoolean(): Boolean
    public external fun isNumber(): Boolean
    public external fun isString(): Boolean
    public external fun isBigInt(): Boolean // TODO: Consider isLong
    public external fun isSymbol(): Boolean
    public external fun isObject(): Boolean

    public external fun asBoolean(): Boolean
    public external fun asNumber(): Double

    public companion object {
        // TODO: Settle on API
        public val undefined: Value @JvmStatic external get
        @JvmStatic public external fun undefined(): Value

        public val `null`: Value @JvmStatic external get
        @JvmStatic public external fun `null`(): Value

//        @JvmStatic public external fun createFromJsonUtf8(
//            runtime: Runtime<*>,
//            json: ByteArray, // TODO: Confirm this works? Maybe ByteBuffer?
//            length: Int, // TODO: This probably doesn't work
//        ): Value
    }
}

public open class Object internal constructor(@DoNotStrip private val mHybridData: HybridData) {}

public class Array private constructor(mHybridData: HybridData) : Object(mHybridData) {}
public class Function private constructor(mHybridData: HybridData) : Object(mHybridData) {}

public class Symbol private constructor(mHybridData: HybridData) : Object(mHybridData) {}
