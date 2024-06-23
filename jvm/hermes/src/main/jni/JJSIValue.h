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
    // class JHermesRuntime;
// class JJSIValue;
// class JJSIObject : public HybridClass<JJSIObject> {
// public:
//     static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Object;";
//     static void registerNatives();
//
//     static bool strictEquals(alias_ref<jclass>, Runtime& runtime, const Object& a, const Object& b);
//
//     explicit JJSIObject(Object&& object) : object_(std::make_shared<Object>(std::move(object))) {}
//
//     bool instanceOf(Runtime& runtime, const Function& ctor);
//     local_ref<JJSIValue::jhybridobject> getProperty(Runtime& runtime, std::string name);
//
// private:
//     friend HybridBase;
//     friend class JJSIValue;
//     std::shared_ptr<Object> object_;
// };

class JJSIValue : public HybridClass<JJSIValue> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/jsi/Value;";
    static void registerNatives();

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
    // local_ref<JJSIObject::jhybridobject> asObject(alias_ref<JJSIRuntime::jhybridobject> jRuntime);
    std::string toString(alias_ref<JJSIRuntime::jhybridobject> jRuntime);

    Value& get_value() const { return *value_; }
private:
    friend HybridBase;
    // needs to exist on heap to persist through JNI calls
    std::shared_ptr<Value> value_;
};
};
