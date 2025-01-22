#pragma once

#include <iostream>
#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <fbjni/ByteBuffer.h>
#include "RuntimeScope.h"

using namespace facebook::jni;
using namespace facebook::jsi;
using namespace std;

namespace intuit::playerui {

[[noreturn]] void throwNativeHandleReleasedException(std::string nativeHandle);

class JHybridClass : public HybridClass<JHybridClass> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/HybridClass;";
    virtual void release() = 0;
    virtual bool isReleased() = 0;

    ~JHybridClass() override = default;
};

struct JRuntimeThreadContext : JavaClass<JRuntimeThreadContext> {
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/hermes/extensions/RuntimeThreadContext;";
};

/**
 * Forward declarations to prevent circular references - jhybridobjects
 * will need to ensure they have the same signature as the actual classes.
 * NOTE: Prefer using actual references when possible.
 */
// TODO: Can we hide these from the implementation (C++) to ensure they use the real types?
#define FORWARD_HYBRID_CLASS(name) \
class name; \
using name ## HybridClass = HybridClass<name, JHybridClass>; \
using name ## _jhybridobject = name ## HybridClass::jhybridobject;

FORWARD_HYBRID_CLASS(JJSIValue)
FORWARD_HYBRID_CLASS(JJSIObject)
// TODO: Technically, this should provide the same class heirarchy (HybridClass<JJSIArray, JJSIObject>) -- add base support to the macro
FORWARD_HYBRID_CLASS(JJSIArray)
FORWARD_HYBRID_CLASS(JJSIFunction)
FORWARD_HYBRID_CLASS(JJSISymbol)

class JJSIPreparedJavaScript : public HybridClass<JJSIPreparedJavaScript> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/PreparedJavaScript;";
    static void registerNatives();

    explicit JJSIPreparedJavaScript(std::shared_ptr<const PreparedJavaScript> prepared) : prepared_(prepared) {}

    std::shared_ptr<const PreparedJavaScript> get_prepared() const {
        if (prepared_) return prepared_;

        throwNativeHandleReleasedException("PreparedJavaScript");
    }
private:
    std::shared_ptr<const PreparedJavaScript> prepared_;
};

/** Java class wrapper for facebook::jsi::Runtime */
class JJSIRuntime : public HybridClass<JJSIRuntime> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Runtime;";
    static void registerNatives();

    local_ref<JJSIValue_jhybridobject> evaluateJavaScript(alias_ref<JRuntimeThreadContext>, std::string script, std::string sourceURL);
    local_ref<JJSIPreparedJavaScript::jhybridobject> prepareJavaScript(alias_ref<JRuntimeThreadContext>, std::string script, std::string sourceURL);
    local_ref<JJSIValue_jhybridobject> evaluatePreparedJavaScript(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIPreparedJavaScript::jhybridobject> js);

#ifdef JSI_MICROTASK
    void queueMicrotask(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIFunction_jhybridobject> callback);
    bool drainMicrotasks(alias_ref<JRuntimeThreadContext>, int maxMicrotasksHint = -1);
#endif

    local_ref<JJSIObject_jhybridobject> global(alias_ref<JRuntimeThreadContext>);
    std::string description(alias_ref<JRuntimeThreadContext>);

    // TODO: Come back and implement this for CDT support
    // bool isInspectable();
    // local_ref<JJSIInstrumentation_jhybridobject> instrumentation();

    virtual Runtime& get_runtime() = 0;

    virtual shared_ptr<RuntimeScope> get_scope() = 0;
};

/**
 * Runtime agnostic reference wrapper runtime implementation. Neither the
 * base implementation, nor this, can partake in memory management b/c we don't
 * know the concrete runtime type to create smart pointers for. So, we just wrap
 * the reference up for use at a later point. This shouldn't be used for creating
 * and managing instances of a runtime, that should be done with the runtime
 * specific JNI constructs to ensure it can hold the correct smart pointer.
 */
class JJSIRuntimeWrapper : public HybridClass<JJSIRuntimeWrapper, JJSIRuntime> {
public:
    Runtime& get_runtime() override {
        return runtime_;
    };

    JJSIRuntimeWrapper(Runtime& runtime) : HybridClass(), runtime_(runtime) {}
private:
    std::reference_wrapper<Runtime> runtime_;
};

class JJSIValue : public JJSIValueHybridClass {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Value;";
    static void registerNatives();

    static local_ref<jhybridobject> fromBool(alias_ref<jclass>, bool b);
    static local_ref<jhybridobject> fromDouble(alias_ref<jclass>, double d);
    static local_ref<jhybridobject> fromInt(alias_ref<jclass>, int i);
    static local_ref<jhybridobject> fromString(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string str);
    static local_ref<jhybridobject> fromLong(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, jlong l);

    static local_ref<jhybridobject> fromSymbol(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSISymbol_jhybridobject> symbol);
    static local_ref<jhybridobject> fromObject(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIObject_jhybridobject> object);

    static local_ref<jhybridobject> undefined(alias_ref<jclass>);
    static local_ref<jhybridobject> null(alias_ref<jclass>);
    static local_ref<jhybridobject> createFromJsonUtf8(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JByteBuffer> json);
    static bool strictEquals(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b);

    explicit JJSIValue(std::shared_ptr<RuntimeScope> scope, Value&& value) : HybridClass(), scope_(scope) {
        // internally creates unique ptr
        if (!std::is_fundamental<decltype(value)>::value && !value.isUndefined() && !value.isNull()) {
            scope->trackValue(this, std::move(value));
        } else {
            tracked = false;
            value_ = std::make_unique<Value>(std::move(value));
        }
    }

    explicit JJSIValue(Value&& value) : HybridClass(), value_(std::make_unique<Value>(std::move(value))) {
        tracked = false;
    }

    bool isUndefined();
    bool isNull();
    bool isBool();
    bool isNumber();
    bool isString();
    bool isBigInt();
    bool isSymbol();
    bool isObject();

    bool asBool();
    double asNumber();
    std::string asString(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    jlong asBigInt(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSISymbol_jhybridobject> asSymbol(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSIObject_jhybridobject> asObject(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    std::string toString(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    ~JJSIValue() override {
        release();
    }

    void release() override {
        if (!tracked && value_) value_.reset();
        if (scope_) scope_->clearRef(this);
    }

    bool isReleased() override {
        return (!tracked && value_ == nullptr) || scope_->getValue((void *)this) == nullptr;
    }

    Value& get_value() const {
        if (!tracked && value_) {
            return *value_;
        }
        if (scope_) {
            if (auto ref = scope_->getValue((void *)this)) {
                return *ref;
            }
        }

        throwNativeHandleReleasedException("Value");
    }
private:
    friend HybridBase;
    shared_ptr<RuntimeScope> scope_;
    bool tracked = true;
    std::unique_ptr<Value> value_;
};

/** JSI Object hybrid class - initially ignoring support for host object, native state, and array buffers. */
class JJSIObject : public JJSIObjectHybridClass {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Object;";
    static void registerNatives();

    static local_ref<jhybridobject> create(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    static bool strictEquals(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b);

    explicit JJSIObject(shared_ptr<RuntimeScope> scope, Object&& object) : HybridClass(), scope_(scope) {
        scope->trackObject(this, std::move(object));
    }

    bool instanceOf(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIFunction_jhybridobject> ctor);

    bool isArray(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    bool isFunction(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    local_ref<JJSIArray_jhybridobject> asArray(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSIFunction_jhybridobject> asFunction(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    bool hasProperty(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name);
    void setProperty(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name, alias_ref<JJSIValue::jhybridobject> value);

    local_ref<JJSIArray_jhybridobject> getPropertyNames(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSIValue::jhybridobject> getProperty(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name);
    local_ref<jhybridobject> getPropertyAsObject(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name);
    local_ref<JJSIFunction_jhybridobject> getPropertyAsFunction(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name);

    ~JJSIObject() override {
        release();
    }

    void release() override {
        if (scope_) scope_->clearRef(this);
    }

    bool isReleased() override {
        return scope_->getObject((void *)this) == nullptr;
    }

    Object& get_object() const {
        if (scope_) {
            if (auto ref = scope_->getObject((void *)this)) {
                return *ref;
            }
        }

        throwNativeHandleReleasedException("Object");
    }
private:
    friend HybridBase;
    friend class JJSIValue;
    std::shared_ptr<RuntimeScope> scope_;
};

class JJSIArray : public JJSIArrayHybridClass {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Array;";
    static void registerNatives();

    static local_ref<jhybridobject> createWithElements(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> elements);

    explicit JJSIArray(shared_ptr<RuntimeScope> scope, Array&& array) : HybridClass(), scope_(scope) {
        scope->trackArray(this, std::move(array));
    }

    int size(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSIValue::jhybridobject> getValueAtIndex(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, int i);
    void setValueAtIndex(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, int i, alias_ref<JJSIValue::jhybridobject> value);

    ~JJSIArray() override {
        release();
    }

    void release() override {
        if (scope_) scope_->clearRef(this);
    }

    bool isReleased() override {
        return scope_->getArray((void *)this) == nullptr;
    }

    Array& get_array() const {
        if (scope_) {
            if (auto ref = scope_->getArray((void *)this)) {
                return *ref;
            }
        }

        throwNativeHandleReleasedException("Array");
    }
private:
    friend HybridBase;
    shared_ptr<RuntimeScope> scope_;
};

struct JJSIHostFunction : JavaClass<JJSIHostFunction> {
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/HostFunction;";

    // Explicitly static API to allow the JJSIHostFunction reference to be passed in, as it usually comes in as
    // a reference that we need to explicitly make_global to ensure it persists until the time the host function
    // is actually called.
    static Value call(alias_ref<JJSIHostFunction> jThis, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIValue::jhybridobject> thisVal, alias_ref<JArrayClass<JJSIValue::jhybridobject>> values);

    Value call(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIValue::jhybridobject> thisVal, alias_ref<JArrayClass<JJSIValue::jhybridobject>> values);
};

class JJSIFunction : public JJSIFunctionHybridClass {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Function;";
    static void registerNatives();

    static local_ref<jhybridobject> createFromHostFunction(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name, int paramCount, alias_ref<JJSIHostFunction> func);

    explicit JJSIFunction(shared_ptr<RuntimeScope> scope, Function&& function) : HybridClass(), scope_(scope) {
        scope->trackFunction(this, std::move(function));
    }

    local_ref<JJSIValue::jhybridobject> call(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args);
    local_ref<JJSIValue::jhybridobject> callWithThis(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIObject::jhybridobject> jsThis, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args);
    local_ref<JJSIValue::jhybridobject> callAsConstructor(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args);
    bool isHostFunction(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    ~JJSIFunction() override {
        release();
    }

    void release() override {
        if (scope_) scope_->clearRef(this);
    }

    bool isReleased() override {
        return scope_->getFunction((void *)this) == nullptr;
    }

    Function& get_function() const {
        if (scope_) {
            if (auto ref = scope_->getFunction((void *)this)) {
                return *ref;
            }
        }

        throwNativeHandleReleasedException("Function");
    }
private:
    friend HybridBase;
    shared_ptr<RuntimeScope> scope_;
};

class JJSISymbol : public JJSISymbolHybridClass {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Symbol;";
    static void registerNatives();

    static bool strictEquals(alias_ref<jclass>, alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b);

    explicit JJSISymbol(shared_ptr<RuntimeScope> scope, Symbol&& symbol) : HybridClass(), scope_(scope) {
        scope->trackSymbol(this, std::move(symbol));
    }

    std::string toString(alias_ref<JRuntimeThreadContext>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    ~JJSISymbol() override {
        release();
    }

    void release() override {
        if (scope_) scope_->clearRef(this);
    }

    bool isReleased() override {
        return scope_->getSymbol((void *)this) == nullptr;
    }

    Symbol& get_symbol() const {
        if (scope_) {
            if (auto ref = scope_->getSymbol((void *)this)) {
                return *ref;
            }
        }

        throwNativeHandleReleasedException("Symbol");
    }
private:
    friend HybridBase;
    shared_ptr<RuntimeScope> scope_;
};
};
