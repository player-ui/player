// ReSharper disable CppMemberFunctionMayBeConst (breaks JNI registration)
#include "JJSIValue.h"

#include <iostream>

namespace intuit::playerui {

void JJSIRuntime::registerNatives() {
    registerHybrid({});
}

local_ref<JJSIValue::jhybridobject> JJSIValue::undefined(alias_ref<jclass>) {
    return newObjectCxxArgs(Value::undefined());
}

local_ref<JJSIValue::jhybridobject> JJSIValue::null(alias_ref<jclass>) {
    return newObjectCxxArgs(Value::null());
}

local_ref<JJSIValue::jhybridobject> JJSIValue::createFromJsonUtf8(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JByteBuffer> json) {
    Runtime& runtime = cthis(jRuntime)->get_runtime();

    // Direct ByteBuffers are an efficient way to transfer bulk data between Java and C++.
    if (!json->isDirect()) {
        // TODO: Verify if we even need this
        throw std::runtime_error("Argument is not a direct buffer.");
    }

    return newObjectCxxArgs(Value::createFromJsonUtf8(runtime, json->getDirectBytes(), json->getDirectSize()));
}

bool JJSIValue::strictEquals(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b) {
    Runtime& runtime = cthis(jRuntime)->get_runtime();
    return Value::strictEquals(runtime, cthis(a)->get_value(), cthis(b)->get_value());
}

bool JJSIValue::isUndefined() {
    return value_->isUndefined();
}

bool JJSIValue::isNull() {
    return value_->isNull();
}

bool JJSIValue::isBool() {
    return value_->isBool();
}

bool JJSIValue::isNumber() {
    return value_->isNumber();
}

bool JJSIValue::isString() {
    return value_->isString();
}

bool JJSIValue::isBigInt() {
    return value_->isBigInt();
}

bool JJSIValue::isSymbol() {
    return value_->isSymbol();
}

bool JJSIValue::isObject() {
    return value_->isObject();
}

bool JJSIValue::asBool() {
    return value_->asBool();
}

double JJSIValue::asNumber() {
    return value_->asNumber();
}

// TODO: Ensure this is what we want to do - we can return the JSI String container
//       instead to help be more optimistic about memory, but this helps w/ runtime access
std::string JJSIValue::asString(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    Runtime& runtime = cthis(jRuntime)->get_runtime();
    return value_->asString(runtime).utf8(runtime);
}

int64_t JJSIValue::asBigInt(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    Runtime& runtime = cthis(jRuntime)->get_runtime();
    return value_->asBigInt(runtime).asInt64(runtime);
}

// TODO: This is string support for symbols, on par w/ existing runtimes
//       Wrapping symbol should be easy enough, but JSI doesn't even have
//       full suport but at least we'd get an equality API :P
std::string JJSIValue::asSymbol(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    Runtime& runtime = cthis(jRuntime)->get_runtime();
    return value_->asSymbol(runtime).toString(runtime);
}

// local_ref<JJSIObject::jhybridobject> JJSIValue::asObject(Runtime& runtime) {
//     return JJSIObject::newObjectCxxArgs(value_->asObject(runtime));
// }

std::string JJSIValue::toString(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    Runtime& runtime = cthis(jRuntime)->get_runtime();
    return value_->toString(runtime).utf8(runtime);
}

void JJSIValue::registerNatives() {
    registerHybrid({
        // TODO: Settle on getter API
        // MARK: Static Value APIs
        makeNativeMethod("undefined", JJSIValue::undefined),
        makeNativeMethod("getUndefined", JJSIValue::undefined),

        makeNativeMethod("null", JJSIValue::null),
        makeNativeMethod("getNull", JJSIValue::null),

        makeNativeMethod("createFromJsonUtf8", JJSIValue::createFromJsonUtf8),
        makeNativeMethod("strictEquals", JJSIValue::strictEquals),

        // MARK: Value APIs
        makeNativeMethod("isUndefined", JJSIValue::isUndefined),
        makeNativeMethod("isNull", JJSIValue::isNull),
        makeNativeMethod("isBoolean", JJSIValue::isBool),
        makeNativeMethod("isNumber", JJSIValue::isNumber),
        makeNativeMethod("isString", JJSIValue::isString),
        makeNativeMethod("isBigInt", JJSIValue::isBigInt),
        makeNativeMethod("isSymbol", JJSIValue::isSymbol),
        makeNativeMethod("isObject", JJSIValue::isObject),


        // peferring `as` APIs to let native exceptions bubble to JVM but let JSI tell us if it's actually that type
        // but maybe need to walk back this strategy to allow us to use null as a type signifier, and avoid exceptions
        // implicit naming conversion for JVM<->native
        makeNativeMethod("asBoolean", JJSIValue::asBool),
        makeNativeMethod("asNumber", JJSIValue::asNumber),
        makeNativeMethod("asSymbol", JJSIValue::asSymbol),
        makeNativeMethod("asBigInt", JJSIValue::asBigInt),
        makeNativeMethod("asString", JJSIValue::asString),
        // makeNativeMethod("asObject", JJSIValue::asObject),

        makeNativeMethod("toString", JJSIValue::toString),
    });
}

// bool JJSIObject::strictEquals(alias_ref<jclass>, Runtime &runtime, const Object &a, const Object &b) {
//     return Object::strictEquals(runtime, a, b);
// }
//
// bool JJSIObject::instanceOf(Runtime &runtime, const Function &ctor) {
//     return object_->instanceOf(runtime, ctor);
// }
//
// local_ref<JJSIValue::jhybridobject> JJSIObject::getProperty(Runtime &runtime, std::string name) {
//     return JJSIValue::newObjectCxxArgs(object_->getProperty(runtime, name.c_str()));
// }
//
// void JJSIObject::registerNatives() {
//     registerHybrid({
//         // MARK: Static Object APIs
//         makeNativeMethod("strictEquals", JJSIObject::strictEquals),
//
//         // MARK Object APIs
//         makeNativeMethod("instanceOf", JJSIObject::instanceOf),
//         makeNativeMethod("getProperty", JJSIObject::getProperty),
//     });
// }

};
