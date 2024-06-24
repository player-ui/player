package com.intuit.playerui.jsi

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import kotlinx.serialization.json.JsonElement
import java.nio.ByteBuffer

public class PreparedJavaScript(@DoNotStrip private val mHybridData: HybridData)

// NOTE: mHybridData is required to be a member field, so we put it in the constructor
public abstract class Runtime(@DoNotStrip private val mHybridData: HybridData) {
    public external fun evaluateJavaScript(script: String, sourceURL: String = "unknown"): Value
    public external fun prepareJavaScript(script: String, sourceURL: String = "unknown"): PreparedJavaScript
    public external fun evaluatePreparedJavaScript(js: PreparedJavaScript): Value
    public external fun queueMicrotask(callback: Function)
    public external fun drainMicrotasks(maxMicrotasksHint: Int = -1): Boolean
    public external fun global(): Object
    public external fun description(): String
}

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
    public external fun asSymbol(runtime: Runtime): Symbol
    public external fun asObject(runtime: Runtime): Object
    public external fun toString(runtime: Runtime): String

    // TODO: I want to enable this, but requires runtime access
    //       Either, we store the runtime in the obj, or we make all runtime accesses explicit
//    public external override fun toString(): String

    public fun strictEquals(runtime: Runtime, other: Value): Boolean = strictEquals(runtime, this, other)

    // TODO: if the underlying hybridclass maintains a reference to the runtime, it'd be nice to expose that for the node impl

    public companion object {
        @JvmStatic public external fun from(value: Int): Value

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

    public external fun isArray(runtime: Runtime): Boolean
    public external fun isFunction(runtime: Runtime): Boolean
    public external fun asArray(runtime: Runtime): Array
    public external fun asFunction(runtime: Runtime): Function

    public external fun hasProperty(runtime: Runtime, name: String): Boolean
    public external fun setProperty(runtime: Runtime, name: String, value: Value)
    public external fun getPropertyNames(runtime: Runtime): Array
    public external fun getProperty(runtime: Runtime, name: String): Value
    public external fun getPropertyAsObject(runtime: Runtime, name: String): Object
    public external fun getPropertyAsFunction(runtime: Runtime, name: String): Function

    public companion object {
        @JvmStatic public external fun strictEquals(runtime: Runtime, a: Object, b: Object): Boolean
    }
}

public class Array private constructor(mHybridData: HybridData) : Object(mHybridData) {
    public external fun size(runtime: Runtime): Int
    public external fun getValueAtIndex(runtime: Runtime, index: Int): Value
    public external fun setValueAtIndex(runtime: Runtime, index: Int, value: Value)

    public companion object {
        @JvmStatic public external fun createWithElements(runtime: Runtime, vararg elements: Value): Array
    }
}

public class Function private constructor(mHybridData: HybridData) : Object(mHybridData) {
    public external fun call(runtime: Runtime, vararg args: Value): Value
    public external fun callWithThis(runtime: Runtime, jsThis: Object, vararg value: Value): Value
    public external fun callAsConstructor(runtime: Runtime, vararg value: Value): Value
}

public class Symbol private constructor(mHybridData: HybridData) : Object(mHybridData) {
    public external fun toString(runtime: Runtime): String
}
