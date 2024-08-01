#pragma once

#include <iostream>
#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <fbjni/ByteBuffer.h>

using namespace facebook::jni;
using namespace facebook::jsi;

namespace intuit::playerui {

[[noreturn]] void throwNativeHandleReleasedException(std::string nativeHandle);

class JHybridClass : public HybridClass<JHybridClass> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/HybridClass;";
    virtual void release() = 0;
    virtual bool isReleased() = 0;

    ~JHybridClass() override = default;
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

    local_ref<JJSIValue_jhybridobject> evaluateJavaScript(std::string script, std::string sourceURL);
    local_ref<JJSIPreparedJavaScript::jhybridobject> prepareJavaScript(std::string script, std::string sourceURL);
    local_ref<JJSIValue_jhybridobject> evaluatePreparedJavaScript(alias_ref<JJSIPreparedJavaScript::jhybridobject> js);

#ifdef JSI_MICROTASK
    void queueMicrotask(alias_ref<JJSIFunction_jhybridobject> callback);
    bool drainMicrotasks(int maxMicrotasksHint = -1);
#endif

    local_ref<JJSIObject_jhybridobject> global();
    std::string description();

    // TODO: Come back and implement this for CDT support
    // bool isInspectable();
    // local_ref<JJSIInstrumentation_jhybridobject> instrumentation();

    /** Ensure the runtime knows about our wrappers, so it can release runtime values before releasing the runtimes */
    virtual void trackRef(alias_ref<JHybridClass::jhybridobject> ref) = 0;

    virtual Runtime& get_runtime() = 0;
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

    void trackRef(alias_ref<JHybridClass::jhybridobject> ref) override {
        throw std::runtime_error("Agnostic runtime wrapper cannot be used to track references. Ensure you track references with the concrete runtime wrapper.");
    }

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
    static local_ref<jhybridobject> fromString(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string str);
    static local_ref<jhybridobject> fromLong(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, jlong l);

    static local_ref<jhybridobject> fromSymbol(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSISymbol_jhybridobject> symbol);
    static local_ref<jhybridobject> fromObject(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIObject_jhybridobject> object);

    static local_ref<jhybridobject> undefined(alias_ref<jclass>);
    static local_ref<jhybridobject> null(alias_ref<jclass>);
    static local_ref<jhybridobject> createFromJsonUtf8(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JByteBuffer> json);
    static bool strictEquals(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b);

    explicit JJSIValue(Value&& value) : HybridClass(), value_(std::make_unique<Value>(std::move(value))) {}

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
    std::string asString(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    jlong asBigInt(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSISymbol_jhybridobject> asSymbol(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSIObject_jhybridobject> asObject(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    std::string toString(alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    void release() override {
        value_.reset();
    }

    bool isReleased() override {
        return value_ == nullptr;
    }

    Value& get_value() const {
        if (value_) return *value_;

        throwNativeHandleReleasedException("Value");
    }
private:
    friend HybridBase;
    std::unique_ptr<Value> value_;
};

/** JSI Object hybrid class - initially ignoring support for host object, native state, and array buffers. */
class JJSIObject : public JJSIObjectHybridClass {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Object;";
    static void registerNatives();

    static local_ref<jhybridobject> create(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    static bool strictEquals(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b);

    explicit JJSIObject(Object&& object) : HybridClass(), object_(std::make_unique<Object>(std::move(object))) {}

    bool instanceOf(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIFunction_jhybridobject> ctor);

    bool isArray(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    bool isFunction(alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    local_ref<JJSIArray_jhybridobject> asArray(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSIFunction_jhybridobject> asFunction(alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    bool hasProperty(alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name);
    void setProperty(alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name, alias_ref<JJSIValue::jhybridobject> value);

    local_ref<JJSIArray_jhybridobject> getPropertyNames(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSIValue::jhybridobject> getProperty(alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name);
    local_ref<jhybridobject> getPropertyAsObject(alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name);
    local_ref<JJSIFunction_jhybridobject> getPropertyAsFunction(alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name);

    void release() override {
        object_.reset();
    }

    bool isReleased() override {
        return object_ == nullptr;
    }

    Object& get_object() const {
        if (object_) return *object_;

        throwNativeHandleReleasedException("Object");
    }
private:
    friend HybridBase;
    friend class JJSIValue;
    std::unique_ptr<Object> object_;
};

class JJSIArray : public JJSIArrayHybridClass {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Array;";
    static void registerNatives();

    static local_ref<jhybridobject> createWithElements(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> elements);

    explicit JJSIArray(Array&& function) : HybridClass(), array_(std::make_unique<Array>(std::move(function))) {}

    int size(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSIValue::jhybridobject> getValueAtIndex(alias_ref<JJSIRuntime::jhybridobject> jRuntime, int i);
    void setValueAtIndex(alias_ref<JJSIRuntime::jhybridobject> jRuntime, int i, alias_ref<JJSIValue::jhybridobject> value);

    void release() override {
        array_.reset();
    }

    bool isReleased() override {
        return array_ == nullptr;
    }

    Array& get_array() const {
        if (array_) return *array_;

        throwNativeHandleReleasedException("Array");
    }
private:
    friend HybridBase;
    std::unique_ptr<Array> array_;
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

    static local_ref<jhybridobject> createFromHostFunction(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, std::string name, int paramCount, alias_ref<JJSIHostFunction> func);

    explicit JJSIFunction(Function&& function) : HybridClass(), function_(std::make_unique<Function>(std::move(function))) {}

    local_ref<JJSIValue::jhybridobject> call(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args);
    local_ref<JJSIValue::jhybridobject> callWithThis(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIObject::jhybridobject> jsThis, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args);
    local_ref<JJSIValue::jhybridobject> callAsConstructor(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args);
    bool isHostFunction(alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    void release() override {
        function_.reset();
    }

    bool isReleased() override {
        return function_ == nullptr;
    }

    Function& get_function() const {
        if (function_) return *function_;

        throwNativeHandleReleasedException("Function");
    }
private:
    friend HybridBase;
    std::unique_ptr<Function> function_;
};

class JJSISymbol : public JJSISymbolHybridClass {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Symbol;";
    static void registerNatives();

    static bool strictEquals(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b);

    explicit JJSISymbol(Symbol&& symbol) : HybridClass(), symbol_(std::make_unique<Symbol>(std::move(symbol))) {}

    std::string toString(alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    void release() override {
        symbol_.reset();
    }

    bool isReleased() override {
        return symbol_ == nullptr;
    }

    Symbol& get_symbol() const {
        if (symbol_) return *symbol_;

        throwNativeHandleReleasedException("Symbol");
    }
private:
    friend HybridBase;
    std::unique_ptr<Symbol> symbol_;
};
};
