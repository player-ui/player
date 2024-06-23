#pragma once

#include <iostream>
#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <fbjni/ByteBuffer.h>

using namespace facebook::jni;
using namespace facebook::jsi;

namespace intuit::playerui {

/** Java class wrapper providing some native getter for a Runtime. This exists to prevent a circular dependency for JJSIRuntime based methods. */
class JJSIRuntime : public HybridClass<JJSIRuntime> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Runtime;";
    static void registerNatives();
    virtual Runtime& get_runtime() = 0;
};

/** Forward declarations to prevent circular references - jhybridobjects will need to ensure they have the same signature as the actual classes. Prefer using actual references when possible */
class JJSIObject;
// TODO: Can we hide these from the implementation (C++) to ensure they use the real types?
using JJSIObjectHybridClass = HybridClass<JJSIObject>;
using JJSIObject_jhybridobject = JJSIObjectHybridClass::jhybridobject;
class JJSIArray;
// TODO: Technically, this should provide the same class heirarchy (HybridClass<JJSIArray, JJSIObject>)
using JJSIArrayHybridClass = HybridClass<JJSIArray>;
using JJSIArray_jhybridobject = JJSIArrayHybridClass::jhybridobject;
class JJSIFunction;
using JJSIFunctionHybridClass = HybridClass<JJSIFunction>;
using JJSIFunction_jhybridobject = JJSIFunctionHybridClass::jhybridobject;

class JJSIValue : public HybridClass<JJSIValue> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Value;";
    static void registerNatives();

    static local_ref<jhybridobject> from(alias_ref<jclass>, int i);

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
    std::string asSymbol(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    // MARK: This is b/c we're forward declaring JJSIObject, but need to give enough information to declare _what_ it's going to be
    local_ref<HybridClass<JJSIObject>::jhybridobject> asObject(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
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
};
