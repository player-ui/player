#pragma once

#include <iostream>
#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <fbjni/ByteBuffer.h>

using namespace facebook::jni;
using namespace facebook::jsi;

namespace intuit::playerui {

/**
 * Forward declarations to prevent circular references - jhybridobjects
 * will need to ensure they have the same signature as the actual classes.
 * NOTE: Prefer using actual references when possible.
 */
// TODO: Can we hide these from the implementation (C++) to ensure they use the real types?
#define FORWARD_HYBRID_CLASS(name) \
class name; \
using name ## HybridClass = HybridClass<name>; \
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

    explicit JJSIPreparedJavaScript(std::shared_ptr<const PreparedJavaScript> prepared) : prepared_(std::move(prepared)) {}

    std::shared_ptr<const PreparedJavaScript> get_prepared() const { return prepared_; }
private:
    std::shared_ptr<const PreparedJavaScript> prepared_;
};

/** Java class wrapper providing some native getter for a Runtime. This exists to prevent a circular dependency for JJSIRuntime based methods. */
class JJSIRuntime : public HybridClass<JJSIRuntime> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Runtime;";
    static void registerNatives();

    local_ref<JJSIValue_jhybridobject> evaluateJavaScript(std::string script, std::string sourceURL);
    local_ref<JJSIPreparedJavaScript::jhybridobject> prepareJavaScript(std::string script, std::string sourceURL);
    local_ref<JJSIValue_jhybridobject> evaluatePreparedJavaScript(alias_ref<JJSIPreparedJavaScript::jhybridobject> js);
    void queueMicrotask(alias_ref<JJSIFunction_jhybridobject> callback);
    bool drainMicrotasks(int maxMicrotasksHint = -1);
    local_ref<JJSIObject_jhybridobject> global();
    std::string description();

    // TODO: Come back and implement this for CDT support
    // bool isInspectable();
    // local_ref<JJSIInstrumentation_jhybridobject> instrumentation();

    virtual Runtime& get_runtime() = 0;
};

class JJSIValue : public HybridClass<JJSIValue> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Value;";
    static void registerNatives();

    static local_ref<jhybridobject> fromBool(alias_ref<jclass>, bool b);
    static local_ref<jhybridobject> fromDouble(alias_ref<jclass>, double d);
    static local_ref<jhybridobject> fromInt(alias_ref<jclass>, int i);
    static local_ref<jhybridobject> fromString(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject>, std::string str);

    static local_ref<jhybridobject> undefined(alias_ref<jclass>);
    static local_ref<jhybridobject> null(alias_ref<jclass>);
    static local_ref<jhybridobject> createFromJsonUtf8(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JByteBuffer> json);
    static bool strictEquals(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b);

    explicit JJSIValue(Value&& value) : value_(std::make_shared<Value>(std::move(value))) {}

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
    int64_t asBigInt(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSISymbol_jhybridobject> asSymbol(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSIObject_jhybridobject> asObject(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    std::string toString(alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    Value& get_value() const { return *value_; }
private:
    friend HybridBase;
    // needs to exist on heap to persist through JNI calls
    std::shared_ptr<Value> value_;
};

/** JSI Object hybrid class - initially ignoring support for host object, native state, and array buffers. */
class JJSIObject : public JJSIObjectHybridClass {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Object;";
    static void registerNatives();

    static bool strictEquals(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<jhybridobject> a, alias_ref<jhybridobject> b);

    explicit JJSIObject(Object&& object) : object_(std::make_shared<Object>(std::move(object))) {}

    bool instanceOf(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<HybridClass<JJSIFunction>::jhybridobject> ctor);

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

    Object& get_object() const { return *object_; }
private:
    friend HybridBase;
    friend class JJSIValue;
    std::shared_ptr<Object> object_;
};

class JJSIArray : public JJSIArrayHybridClass {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Array;";
    static void registerNatives();

    static local_ref<jhybridobject> createWithElements(alias_ref<jclass>, alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> elements);

    explicit JJSIArray(Array&& function) : array_(std::make_shared<Array>(std::move(function))) {}

    int size(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    local_ref<JJSIValue::jhybridobject> getValueAtIndex(alias_ref<JJSIRuntime::jhybridobject> jRuntime, int i);
    void setValueAtIndex(alias_ref<JJSIRuntime::jhybridobject> jRuntime, int i, alias_ref<JJSIValue::jhybridobject> value);

    Array& get_array() const { return *array_; }
private:
    friend HybridBase;
    std::shared_ptr<Array> array_;
};

class JJSIFunction : public JJSIFunctionHybridClass {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Function;";
    static void registerNatives();

    explicit JJSIFunction(Function&& function) : function_(std::make_shared<Function>(std::move(function))) {}

    local_ref<JJSIValue::jhybridobject> call(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args);
    local_ref<JJSIValue::jhybridobject> callWithThis(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JJSIObject::jhybridobject> jsThis, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args);
    local_ref<JJSIValue::jhybridobject> callAsConstructor(alias_ref<JJSIRuntime::jhybridobject> jRuntime, alias_ref<JArrayClass<JJSIValue::jhybridobject>> args);

    Function& get_function() const { return *function_; }
private:
    friend HybridBase;
    std::shared_ptr<Function> function_;
};

class JJSISymbol : public JJSISymbolHybridClass {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Symbol;";
    static void registerNatives();

    explicit JJSISymbol(Symbol&& symbol) : symbol_(std::make_shared<Symbol>(std::move(symbol))) {}

    std::string toString(alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    Symbol& get_symbol() const { return *symbol_; }
private:
    friend HybridBase;
    std::shared_ptr<Symbol> symbol_;
};
};
