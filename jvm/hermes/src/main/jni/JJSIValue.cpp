// ReSharper disable CppMemberFunctionMayBeConst (breaks JNI registration)
#include "JJSIValue.h"
#include "ValueHelpers.h"

#include <iostream>

// namespace intuit::playerui {
using namespace intuit::playerui;

local_ref<JJSIValue::jhybridobject> JJSIValue::undefined(alias_ref<jclass>) {
    return newObjectCxxArgs(Value::undefined());
}

local_ref<JJSIValue::jhybridobject> JJSIValue::null(alias_ref<jclass>) {
    return newObjectCxxArgs(Value::null());
}

local_ref<JJSIValue::jhybridobject> JJSIValue::createFromJsonUtf8(alias_ref<jclass>, Runtime &runtime, const uint8_t *json, size_t length) {
    return newObjectCxxArgs(Value::createFromJsonUtf8(runtime, json, length));
}

bool JJSIValue::strictEquals(alias_ref<jclass>, Runtime &runtime, const Value &a, const Value &b) {
    return Value::strictEquals(runtime, a, b);
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
std::string JJSIValue::asString(Runtime& runtime) {
    return value_->asString(runtime).utf8(runtime);
}

int64_t JJSIValue::asBigInt(Runtime& runtime) {
    return value_->asBigInt(runtime).asInt64(runtime);
}

// TODO: This is string support for symbols, on par w/ existing runtimes
//       Wrapping symbol should be easy enough, but JSI doesn't even have
//       full suport but at least we'd get an equality API :P
std::string JJSIValue::asSymbol(Runtime& runtime) {
    return value_->asSymbol(runtime).toString(runtime);
}

// local_ref<JJSIObject::jhybridobject> JJSIValue::asObject(Runtime& runtime) {
//     return JJSIObject::newObjectCxxArgs(value_->asObject(runtime));
// }

std::string JJSIValue::toString(Runtime& runtime) {
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

        // makeNativeMethod("createFromJsonUtf8", JJSIValue::null),
        // makeNativeMethod("strictEquals", JJSIValue::strictEquals),


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
        // makeNativeMethod("asSymbol", JJSIValue::asSymbol),
        // makeNativeMethod("asBigInt", JJSIValue::asBigInt),
        // makeNativeMethod("asString", JJSIValue::asString),
        // makeNativeMethod("asObject", JJSIValue::asObject),

        // makeNativeMethod("toString", JJSIValue::toString),
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

// };
