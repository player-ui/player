// ReSharper disable CppMemberFunctionMayBeConst (breaks JNI registration)
#include "JJSIValue.h"

#include <iostream>

namespace intuit::playerui {

[[noreturn]] void throwNativeHandleReleasedException(std::string nativeHandle) {
    // TODO: create a new exception type for this to hook into PlayerRuntimeException
    auto throwableClass = findClassLocal("com/intuit/playerui/core/player/PlayerException");
    auto constructor = throwableClass->getConstructor<jthrowable(jstring)>();
    auto throwable = throwableClass->newObject(constructor, make_jstring("Native handle for " + nativeHandle + " released!").release());

    throwNewJavaException(throwable.get());
    FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
}

std::vector<Value> unwrapJJSIValues(alias_ref<JArrayClass<JJSIValue::jhybridobject>> wrapped) {
    std::vector<Value> values = {};
    values.reserve(wrapped->size());
    for (int i = 0; i < wrapped->size(); ++i) {
        values.push_back(std::move(wrapped->getElement(i)->cthis()->get_value()));
    }
    return values;
}

void JJSIPreparedJavaScript::registerNatives() {
    registerHybrid({});
}

local_ref<JJSIValue::jhybridobject> JJSIRuntime::evaluateJavaScript(alias_ref<JRuntimeThreadContext>, std::string script, std::string sourceURL) {
    return JJSIValue::newObjectCxxArgs(this->get_scope(), get_runtime().evaluateJavaScript(std::make_shared<StringBuffer>(script), sourceURL));;
}

local_ref<JJSIValue::jhybridobject> JJSIRuntime::evaluateHermesBytecode(alias_ref<JRuntimeThreadContext>, alias_ref<jbyteArray> byteArray, std::string sourceURL) {
    auto size = byteArray->size();
    auto region = byteArray->getRegion(0, size);
    return JJSIValue::newObjectCxxArgs(this->get_scope(), get_runtime().evaluateJavaScript(std::make_shared<ByteArrayBuffer>(region.get(), size), sourceURL));
}

local_ref<JJSIPreparedJavaScript::jhybridobject> JJSIRuntime::prepareJavaScript(alias_ref<JRuntimeThreadContext>, std::string script, std::string sourceURL) {
    return JJSIPreparedJavaScript::newObjectCxxArgs(get_runtime().prepareJavaScript(std::make_shared<StringBuffer>(script), sourceURL));
}

local_ref<JJSIValue::jhybridobject> JJSIRuntime::evaluatePreparedJavaScript(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIPreparedJavaScript::jhybridobject> js) {
    return JJSIValue::newObjectCxxArgs(this->get_scope(), get_runtime().evaluatePreparedJavaScript(js->cthis()->get_prepared()));;
}

#ifdef JSI_MICROTASK
void JJSIRuntime::queueMicrotask(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIFunction_jhybridobject> callback) {
    get_runtime().queueMicrotask(callback->cthis()->get_function());
}

bool JJSIRuntime::drainMicrotasks(alias_ref<JRuntimeThreadContext>, int maxMicrotasksHint) {
    return get_runtime().drainMicrotasks(maxMicrotasksHint);
}
#endif

local_ref<JJSIObject::jhybridobject> JJSIRuntime::global(alias_ref<JRuntimeThreadContext>) {
    return JJSIObject::newObjectCxxArgs(this->get_scope(), get_runtime().global());;
}

std::string JJSIRuntime::description(alias_ref<JRuntimeThreadContext>) {
    return get_runtime().description();
}

void JJSIRuntime::registerNatives() {
    registerHybrid({
        makeNativeMethod("evaluateJavaScript", JJSIRuntime::evaluateJavaScript),
        makeNativeMethod("evaluateHermesBytecode", JJSIRuntime::evaluateHermesBytecode),
        makeNativeMethod("prepareJavaScript", JJSIRuntime::prepareJavaScript),
        makeNativeMethod("evaluatePreparedJavaScript", JJSIRuntime::evaluatePreparedJavaScript),
#ifdef JSI_MICROTASK
        makeNativeMethod("queueMicrotask", JJSIRuntime::queueMicrotask),
        makeNativeMethod("drainMicrotasks", JJSIRuntime::drainMicrotasks),
#endif
        makeNativeMethod("global", JJSIRuntime::global),
        makeNativeMethod("description", JJSIRuntime::description),
    });
}

local_ref<JJSIValue::jhybridobject> JJSIValue::fromBool(alias_ref<jclass>, bool b) {
    return newObjectCxxArgs(Value(b));
}

local_ref<JJSIValue::jhybridobject> JJSIValue::fromDouble(alias_ref<jclass>, double d) {
    return newObjectCxxArgs(Value(d));
}

local_ref<JJSIValue::jhybridobject> JJSIValue::fromInt(alias_ref<jclass>, int i) {
    return newObjectCxxArgs(Value(i));
}

local_ref<JJSIValue::jhybridobject> JJSIValue::fromString(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string str) {
    return newObjectCxxArgs(jRuntime->cthis()->get_scope(), String::createFromUtf8(jRuntime->cthis()->get_runtime(), str));;
}

local_ref<JJSIValue::jhybridobject> JJSIValue::fromLong(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, jlong l) {
    return newObjectCxxArgs(jRuntime->cthis()->get_scope(), BigInt::fromInt64(jRuntime->cthis()->get_runtime(), l));;
}

local_ref<JJSIValue::jhybridobject> JJSIValue::fromSymbol(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSISymbol::jhybridobject> symbol) {
    return newObjectCxxArgs(jRuntime->cthis()->get_scope(), Value(jRuntime->cthis()->get_runtime(), symbol->cthis()->get_symbol()));;
}

local_ref<JJSIValue::jhybridobject> JJSIValue::fromObject(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIObject::jhybridobject> object) {
    return newObjectCxxArgs(jRuntime->cthis()->get_scope(), Value(jRuntime->cthis()->get_runtime(), object->cthis()->get_object()));;
}

local_ref<JJSIValue::jhybridobject> JJSIValue::undefined(alias_ref<jclass>) {
    return newObjectCxxArgs(Value::undefined());
}

local_ref<JJSIValue::jhybridobject> JJSIValue::null(alias_ref<jclass>) {
    return newObjectCxxArgs(Value::null());
}

local_ref<JJSIValue::jhybridobject> JJSIValue::createFromJsonUtf8(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JByteBuffer> json) {
    Runtime& runtime = jRuntime->cthis()->get_runtime();

    // Direct ByteBuffers are an efficient way to transfer bulk data between Java and C++.
    if (!json->isDirect()) {
        throw std::runtime_error("Argument is not a direct buffer.");
    }

    auto value = newObjectCxxArgs(jRuntime->cthis()->get_scope(), Value::createFromJsonUtf8(runtime, json->getDirectBytes(), json->getDirectSize()));
    return value;
}

bool JJSIValue::strictEquals(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b) {
    Runtime& runtime = jRuntime->cthis()->get_runtime();
    return Value::strictEquals(runtime, a->cthis()->get_value(), b->cthis()->get_value());
}

bool JJSIValue::isUndefined() {
    return get_value().isUndefined();
}

bool JJSIValue::isNull() {
    return get_value().isNull();
}

bool JJSIValue::isBool() {
    return get_value().isBool();
}

bool JJSIValue::isNumber() {
    return get_value().isNumber();
}

bool JJSIValue::isString() {
    return get_value().isString();
}

bool JJSIValue::isBigInt() {
    return get_value().isBigInt();
}

bool JJSIValue::isSymbol() {
    return get_value().isSymbol();
}

bool JJSIValue::isObject() {
    return get_value().isObject();
}

bool JJSIValue::asBool() {
    return get_value().asBool();
}

double JJSIValue::asNumber() {
    return get_value().asNumber();
}

std::string JJSIValue::asString(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    Runtime& runtime = jRuntime->cthis()->get_runtime();
    return get_value().asString(runtime).utf8(runtime);
}

jlong JJSIValue::asBigInt(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    Runtime& runtime = jRuntime->cthis()->get_runtime();
    return get_value().asBigInt(runtime).asInt64(runtime);
}

local_ref<JJSISymbol::jhybridobject> JJSIValue::asSymbol(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return JJSISymbol::newObjectCxxArgs(jRuntime->cthis()->get_scope(), get_value().asSymbol(jRuntime->cthis()->get_runtime()));;
}

local_ref<JJSIObject::jhybridobject> JJSIValue::asObject(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return JJSIObject::newObjectCxxArgs(jRuntime->cthis()->get_scope(), get_value().asObject(jRuntime->cthis()->get_runtime()));;
}

std::string JJSIValue::toString(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    Runtime& runtime = jRuntime->cthis()->get_runtime();
    return get_value().toString(runtime).utf8(runtime);
}

void JJSIValue::registerNatives() {
    registerHybrid({
        makeNativeMethod("from", JJSIValue::fromBool),
        makeNativeMethod("from", JJSIValue::fromDouble),
        makeNativeMethod("from", JJSIValue::fromInt),
        makeNativeMethod("from", JJSIValue::fromString),
        makeNativeMethod("from", JJSIValue::fromLong),
        makeNativeMethod("from", JJSIValue::fromSymbol),
        makeNativeMethod("from", JJSIValue::fromObject),

        // MARK: Static Value APIs
        makeNativeMethod("getUndefined", JJSIValue::undefined),
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

        // preferring `as` APIs to let native exceptions bubble to JVM but let JSI tell us if it's actually that type
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

local_ref<JJSIObject::jhybridobject> JJSIObject::create(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return newObjectCxxArgs(jRuntime->cthis()->get_scope(), Object(jRuntime->cthis()->get_runtime()));;
}

bool JJSIObject::strictEquals(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b) {
    return Object::strictEquals(jRuntime->cthis()->get_runtime(), a->cthis()->get_object(), b->cthis()->get_object());
}

bool JJSIObject::instanceOf(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIFunction::jhybridobject> ctor) {
    return get_object().instanceOf(jRuntime->cthis()->get_runtime(), ctor->cthis()->get_function());
}

bool JJSIObject::isArray(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return get_object().isArray(jRuntime->cthis()->get_runtime());
}

bool JJSIObject::isFunction(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return get_object().isFunction(jRuntime->cthis()->get_runtime());
}

local_ref<JJSIArray::jhybridobject> JJSIObject::asArray(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return JJSIArray::newObjectCxxArgs(jRuntime->cthis()->get_scope(), get_object().asArray(jRuntime->cthis()->get_runtime()));;
}

local_ref<JJSIFunction::jhybridobject> JJSIObject::asFunction(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    auto function = JJSIFunction::newObjectCxxArgs(jRuntime->cthis()->get_scope(), get_object().asFunction(jRuntime->cthis()->get_runtime()));
    return function;
}

bool JJSIObject::hasProperty(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name) {
    return get_object().hasProperty(jRuntime->cthis()->get_runtime(), name.c_str());
}

void JJSIObject::setProperty(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name, alias_ref<JJSIValue::jhybridobject> value) {
    get_object().setProperty(jRuntime->cthis()->get_runtime(), name.c_str(), value->cthis()->get_value());
}

local_ref<JJSIArray::jhybridobject> JJSIObject::getPropertyNames(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return JJSIArray::newObjectCxxArgs(jRuntime->cthis()->get_scope(), get_object().getPropertyNames(jRuntime->cthis()->get_runtime()));;
}

local_ref<JJSIValue::jhybridobject> JJSIObject::getProperty(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name) {
    return JJSIValue::newObjectCxxArgs(jRuntime->cthis()->get_scope(), get_object().getProperty(jRuntime->cthis()->get_runtime(), name.c_str()));;
}

local_ref<JJSIObject::jhybridobject> JJSIObject::getPropertyAsObject(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name) {
    return newObjectCxxArgs(jRuntime->cthis()->get_scope(), get_object().getPropertyAsObject(jRuntime->cthis()->get_runtime(), name.c_str()));;
}

local_ref<JJSIFunction::jhybridobject> JJSIObject::getPropertyAsFunction(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name) {
    return JJSIFunction::newObjectCxxArgs(jRuntime->cthis()->get_scope(), get_object().getPropertyAsFunction(jRuntime->cthis()->get_runtime(), name.c_str()));;
}

void JJSIObject::registerNatives() {
    registerHybrid({
        // MARK: Static Object APIs
        makeNativeMethod("create", JJSIObject::create),
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

local_ref<JJSIArray::jhybridobject> JJSIArray::createWithElements(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> elements) {
    Runtime& runtime = jRuntime->cthis()->get_runtime();
    Array array = Array(runtime, elements->size());
    for (int i = 0; i < elements->size(); i++) {
        array.setValueAtIndex(runtime, i, elements->getElement(i)->cthis()->get_value());
    }

    auto jArray = newObjectCxxArgs(jRuntime->cthis()->get_scope(), std::move(array));
    return jArray;
}

int JJSIArray::size(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return static_cast<int>(get_array().size(jRuntime->cthis()->get_runtime()));
}

local_ref<JJSIValue::jhybridobject> JJSIArray::getValueAtIndex(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, int i) {
    return JJSIValue::newObjectCxxArgs(jRuntime->cthis()->get_scope(), get_array().getValueAtIndex(jRuntime->cthis()->get_runtime(), i));;
}

void JJSIArray::setValueAtIndex(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, int i, alias_ref<JJSIValue::jhybridobject> value) {
    get_array().setValueAtIndex(jRuntime->cthis()->get_runtime(), i, value->cthis()->get_value());
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

local_ref<JJSIFunction::jhybridobject> JJSIFunction::createFromHostFunction(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name, int paramCount, alias_ref<JJSIHostFunction> func) {
    auto propName = PropNameID::forUtf8(jRuntime->cthis()->get_runtime(), name);

    auto jFunc = make_global(func);
    global_ref<JJSIRuntime::jhybridobject> gRuntime = make_global(jRuntime);
    // TODO: HostFunctionType declares thisVal and args as const, which makes it difficult to wrap
    //       with JJSIValue for cross-jni usage. We've applied a patch to loosen the parameter
    //       constraints, but a better solution would likely be to follow a const (read-only)
    //       approach in a JJSIConstValue class.
    HostFunctionType hostFunc = [jFunc, gRuntime](Runtime& runtime, Value& thisVal, Value* args, size_t count) -> Value {
        local_ref<JArrayClass<JJSIValue::jhybridobject>> values = JArrayClass<JJSIValue::jhybridobject>::newArray(count);
        for (size_t i = 0; i < count; i++) {
            auto arg = JJSIValue::newObjectCxxArgs(gRuntime->cthis()->get_scope(), std::move(args[i]));
            values->setElement(i, arg.get());
        }

        auto reciever = JJSIValue::newObjectCxxArgs(gRuntime->cthis()->get_scope(), std::move(thisVal));

        return JJSIHostFunction::call(jFunc, gRuntime, reciever, values);
    };

    auto function = newObjectCxxArgs(jRuntime->cthis()->get_scope(), Function::createFromHostFunction(jRuntime->cthis()->get_runtime(), propName, paramCount, hostFunc));
    return function;
}

local_ref<JJSIValue::jhybridobject> JJSIFunction::call(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args) {
    auto values = unwrapJJSIValues(args);
    auto result = JJSIValue::newObjectCxxArgs(jRuntime->cthis()->get_scope(), get_function().call(jRuntime->cthis()->get_runtime(), static_cast<const Value*>(values.data()), values.size()));
    return result;
}

local_ref<JJSIValue::jhybridobject> JJSIFunction::callWithThis(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIObject::jhybridobject> jsThis, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args) {
    auto values = unwrapJJSIValues(args);
    auto result = JJSIValue::newObjectCxxArgs(jRuntime->cthis()->get_scope(), get_function().callWithThis(jRuntime->cthis()->get_runtime(), jsThis->cthis()->get_object(), static_cast<const Value*>(values.data()), values.size()));
    return result;
}

local_ref<JJSIValue::jhybridobject> JJSIFunction::callAsConstructor(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args) {
    auto values = unwrapJJSIValues(args);
    auto result = JJSIValue::newObjectCxxArgs(jRuntime->cthis()->get_scope(), get_function().callAsConstructor(jRuntime->cthis()->get_runtime(), static_cast<const Value*>(values.data()), values.size()));
    return result;
}

bool JJSIFunction::isHostFunction(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return get_function().isHostFunction(jRuntime->cthis()->get_runtime());
}

void JJSIFunction::registerNatives() {
    registerHybrid({
        makeNativeMethod("createFromHostFunction", JJSIFunction::createFromHostFunction),

        makeNativeMethod("call", JJSIFunction::call),
        makeNativeMethod("callWithThis", JJSIFunction::callWithThis),
        makeNativeMethod("callAsConstructor", JJSIFunction::callAsConstructor),
        makeNativeMethod("isHostFunction", JJSIFunction::isHostFunction),
    });
}

bool JJSISymbol::strictEquals(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b) {
    return Symbol::strictEquals(jRuntime->cthis()->get_runtime(), a->cthis()->get_symbol(), b->cthis()->get_symbol());
}

std::string JJSISymbol::toString(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime) {
    return get_symbol().toString(jRuntime->cthis()->get_runtime());
}

void JJSISymbol::registerNatives() {
    registerHybrid({
        makeNativeMethod("strictEquals", JJSISymbol::strictEquals),
        makeNativeMethod("toString", JJSISymbol::toString),
    });
}

Value JJSIHostFunction::call(alias_ref<JJSIHostFunction> jThis, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIValue::jhybridobject> thisVal, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args) {
    return jThis->call(jRuntime, thisVal, args);
}

Value JJSIHostFunction::call(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIValue::jhybridobject> thisVal, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args) {
    static const auto method = getClass()->getMethod<
        local_ref<JJSIValue::jhybridobject>(
            alias_ref<JJSIRuntime::jhybridobject>,
            alias_ref<JJSIValue::jhybridobject>,
            alias_ref<JArrayClass<JJSIValue::jhybridobject>>
        )>("call");

    return std::move(method(self(), jRuntime, thisVal, args)->cthis()->get_value());
}

};
