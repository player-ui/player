package com.intuit.playerui.jsi

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import kotlinx.serialization.json.JsonElement
import java.nio.ByteBuffer

public abstract class Runtime(@DoNotStrip private val mHybridData: HybridData)

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
    public external fun asString(runtime: Runtime): String
    public external fun asBigInt(runtime: Runtime): Long
    public external fun asSymbol(runtime: Runtime): String
    public external fun asObject(runtime: Runtime): Object
    public external fun toString(runtime: Runtime): String
//    public external override fun toString(): String

    public fun strictEquals(runtime: Runtime, other: Value): Boolean = strictEquals(runtime, this, other)

    // TODO: if the underlying hybridclass maintains a reference to the runtime, it'd be nice to expose that for the node impl

    public companion object {
        // TODO: Settle on API
        public val undefined: Value @JvmStatic external get
        @JvmStatic public external fun undefined(): Value

        public val `null`: Value @JvmStatic external get
        @JvmStatic public external fun `null`(): Value

        @JvmStatic public external fun createFromJsonUtf8(
            runtime: Runtime,
            json: ByteBuffer,
        ): Value

        @JvmStatic public fun createFromJsonUtf8(
            runtime: Runtime,
            json: ByteArray,
        ): Value = createFromJsonUtf8(runtime, ByteBuffer.allocateDirect(json.size).apply { put(json) })

        @JvmStatic public fun createFromJsonUtf8(
            runtime: Runtime,
            json: String,
        ): Value = createFromJsonUtf8(runtime, json.toByteArray())

        @JvmStatic public fun createFromJson(
            runtime: Runtime,
            json: JsonElement,
        ): Value = createFromJsonUtf8(runtime, json.toString())

        @JvmStatic public external fun strictEquals(runtime: Runtime, a: Value, b: Value): Boolean
    }
}

public open class Object internal constructor(@DoNotStrip private val mHybridData: HybridData) {

    public external fun instanceOf(runtime: Runtime, ctor: Function): Boolean
    public external fun getProperty(runtime: Runtime, name: String): Value

    public companion object {
        @JvmStatic public external fun strictEquals(runtime: Runtime, a: Object, b: Object): Boolean
    }
}

public class Array private constructor(mHybridData: HybridData) : Object(mHybridData) {}
public class Function private constructor(mHybridData: HybridData) : Object(mHybridData) {}

public class Symbol private constructor(mHybridData: HybridData) : Object(mHybridData) {}
