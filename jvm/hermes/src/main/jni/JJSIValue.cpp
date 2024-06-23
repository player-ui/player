// ReSharper disable CppMemberFunctionMayBeConst (breaks JNI registration)
#include "JJSIValue.h"

#include <iostream>

namespace intuit::playerui {

std::vector<Value> unwrapJJSIValues(alias_ref<JArrayClass<JJSIValue::jhybridobject>> wrapped) {
    std::vector<Value> values = {};
    values.reserve(wrapped->size());
    for (int i = 0; i < wrapped->size(); ++i) {
        values.push_back(std::move(wrapped->getElement(i)->cthis()->get_value()));
    }
    return values;
}

void JJSIRuntime::registerNatives() {
    registerHybrid({});
}

local_ref<HybridClass<JJSIValue>::jhybridobject> JJSIValue::from(alias_ref<jclass>, int i) {
    return newObjectCxxArgs(Value(i));
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

local_ref<JJSISymbol::jhybridobject> JJSIValue::asSymbol(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return JJSISymbol::newObjectCxxArgs(value_->asSymbol(jRuntime->cthis()->get_runtime()));
}

local_ref<JJSIObject::jhybridobject> JJSIValue::asObject(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    Runtime& runtime = cthis(jRuntime)->get_runtime();
    return JJSIObject::newObjectCxxArgs(value_->asObject(runtime));
}

std::string JJSIValue::toString(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    Runtime& runtime = cthis(jRuntime)->get_runtime();
    return value_->toString(runtime).utf8(runtime);
}

void JJSIValue::registerNatives() {
    registerHybrid({
        makeNativeMethod("from", JJSIValue::from),

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
        makeNativeMethod("asObject", JJSIValue::asObject),

        makeNativeMethod("toString", JJSIValue::toString),
    });
}

bool JJSIObject::strictEquals(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b) {
    // TODO: Settle on cthis API approach
    return Object::strictEquals(jRuntime->cthis()->get_runtime(), a->cthis()->get_object(), b->cthis()->get_object());
}

bool JJSIObject::instanceOf(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIFunction::jhybridobject> ctor) {
    return object_->instanceOf(cthis(jRuntime)->get_runtime(), ctor->cthis()->get_function());
}

bool JJSIObject::isArray(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return object_->isArray(cthis(jRuntime)->get_runtime());
}

bool JJSIObject::isFunction(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return object_->isFunction(cthis(jRuntime)->get_runtime());
}

local_ref<JJSIArray::jhybridobject> JJSIObject::asArray(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return JJSIArray::newObjectCxxArgs(object_->asArray(jRuntime->cthis()->get_runtime()));
}

local_ref<JJSIFunction::jhybridobject> JJSIObject::asFunction(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return JJSIFunction::newObjectCxxArgs(object_->asFunction(jRuntime->cthis()->get_runtime()));
}

bool JJSIObject::hasProperty(alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name) {
    return object_->hasProperty(jRuntime->cthis()->get_runtime(), name.c_str());
}

void JJSIObject::setProperty(alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name, alias_ref<JJSIValue::jhybridobject> value) {
    // TODO: Need to test value unwrapping
    object_->setProperty(jRuntime->cthis()->get_runtime(), name.c_str(), value->cthis()->get_value());
}

local_ref<JJSIArray::jhybridobject> JJSIObject::getPropertyNames(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return JJSIArray::newObjectCxxArgs(object_->getPropertyNames(jRuntime->cthis()->get_runtime()));
}

local_ref<JJSIValue::jhybridobject> JJSIObject::getProperty(alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name) {
    return JJSIValue::newObjectCxxArgs(object_->getProperty(cthis(jRuntime)->get_runtime(), name.c_str()));
}

local_ref<JJSIObject::jhybridobject> JJSIObject::getPropertyAsObject(alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name) {
    return newObjectCxxArgs(object_->getPropertyAsObject(jRuntime->cthis()->get_runtime(), name.c_str()));
}

local_ref<JJSIFunction::jhybridobject> JJSIObject::getPropertyAsFunction(alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name) {
    return JJSIFunction::newObjectCxxArgs(object_->getPropertyAsFunction(jRuntime->cthis()->get_runtime(), name.c_str()));
}

void JJSIObject::registerNatives() {
    registerHybrid({
        // MARK: Static Object APIs
        makeNativeMethod("strictEquals", JJSIObject::strictEquals),

        // MARK: Object APIs
        makeNativeMethod("instanceOf", JJSIObject::instanceOf),
        makeNativeMethod("isArray", JJSIObject::isArray),
        makeNativeMethod("isFunction", JJSIObject::isFunction),
        makeNativeMethod("asArray", JJSIObject::asArray),
        makeNativeMethod("asFunction", JJSIObject::asFunction),

        makeNativeMethod("hasProperty", JJSIObject::hasProperty),
        makeNativeMethod("setProperty", JJSIObject::setProperty),
        makeNativeMethod("getPropertyNames", JJSIObject::getPropertyNames),
        makeNativeMethod("getProperty", JJSIObject::getProperty),
        makeNativeMethod("getPropertyAsObject", JJSIObject::getPropertyAsObject),
        makeNativeMethod("getPropertyAsFunction", JJSIObject::getPropertyAsFunction),
    });
}

local_ref<JJSIArray::jhybridobject> JJSIArray::createWithElements(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> elements) {
    // TODO: Better way to convert JArrayClass<JJSIValue::jhybridobject> -> initializer_list<Value>
    // TODO: This doesn't work anyways
    std::initializer_list<Value> values = [&]() {
        std::initializer_list<Value> result;
        for (int i = 0; i < elements->size(); ++i) {
            result = {result.begin(), std::move(elements->getElement(i)->cthis()->get_value())};
        }
        return result;
    }();

    return newObjectCxxArgs(Array::createWithElements(jRuntime->cthis()->get_runtime(), values));
}

int JJSIArray::size(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    // TODO: Do we care about potential loss of data here? ASSUMPTION: our JS arrays are not likely to be beyond max_int
    return static_cast<int>(array_->size(jRuntime->cthis()->get_runtime()));
}

local_ref<JJSIValue::jhybridobject> JJSIArray::getValueAtIndex(alias_ref<JJSIRuntime::jhybridobject> jRuntime, int i) {
    return JJSIValue::newObjectCxxArgs(array_->getValueAtIndex(jRuntime->cthis()->get_runtime(), i));
}

void JJSIArray::setValueAtIndex(alias_ref<JJSIRuntime::jhybridobject> jRuntime, int i, alias_ref<JJSIValue::jhybridobject> value) {
    array_->setValueAtIndex(jRuntime->cthis()->get_runtime(), i, value->cthis()->get_value());
}

void JJSIArray::registerNatives() {
    registerHybrid({
        // MARK: Static Array APIs
        makeNativeMethod("createWithElements", JJSIArray::createWithElements),

        // MARK: Array APIs
        makeNativeMethod("size", JJSIArray::size),
        makeNativeMethod("getValueAtIndex", JJSIArray::getValueAtIndex),
        makeNativeMethod("setValueAtIndex", JJSIArray::setValueAtIndex),
    });
}

local_ref<JJSIValue::jhybridobject> JJSIFunction::call(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args) {
    auto values = unwrapJJSIValues(args);
    return JJSIValue::newObjectCxxArgs(function_->call(jRuntime->cthis()->get_runtime(), static_cast<const Value*>(values.data()), values.size()));
}

local_ref<JJSIValue::jhybridobject> JJSIFunction::callWithThis(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIObject::jhybridobject> jsThis, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args) {
    auto values = unwrapJJSIValues(args);
    return JJSIValue::newObjectCxxArgs(function_->callWithThis(jRuntime->cthis()->get_runtime(), jsThis->cthis()->get_object(), static_cast<const Value*>(values.data()), values.size()));
}

local_ref<JJSIValue::jhybridobject> JJSIFunction::callAsConstructor(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args) {
    auto values = unwrapJJSIValues(args);
    return JJSIValue::newObjectCxxArgs(function_->callAsConstructor(jRuntime->cthis()->get_runtime(), static_cast<const Value*>(values.data()), values.size()));
}

void JJSIFunction::registerNatives() {
    registerHybrid({
        makeNativeMethod("call", JJSIFunction::call),
        makeNativeMethod("callWithThis", JJSIFunction::callWithThis),
        makeNativeMethod("callAsConstructor", JJSIFunction::callAsConstructor),
    });
}

std::string JJSISymbol::toString(alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return symbol_->toString(jRuntime->cthis()->get_runtime());
}

void JJSISymbol::registerNatives() {
    registerHybrid({
        makeNativeMethod("toString", JJSISymbol::toString),
    });
}
};
