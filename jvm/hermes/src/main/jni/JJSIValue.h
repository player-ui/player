#pragma once

#include <iostream>
#include <jsi/jsi.h>
#include <fbjni/fbjni.h>

using namespace facebook::jni;
using namespace facebook::jsi;

namespace intuit::playerui {
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
    // TODO: Verify the types for the next two will just come along? Doubtful
    static local_ref<jhybridobject> createFromJsonUtf8(alias_ref<jclass>, Runtime& runtime, const uint8_t* json, size_t length);
    static bool strictEquals(alias_ref<jclass>, Runtime& runtime, const Value& a, const Value& b);

    explicit JJSIValue(
        // TODO: Probably need to maintain runtime reference for value apis, maybe even just weak ref? would help us with a isReleased API
        // std::unique_ptr<facebook::jsi::Runtime> runtime,
        Value&& value
    ) :
        // runtime_(std::move(runtime)),
        value_(std::make_shared<Value>(std::move(value))) {}

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
    // TODO: If we can store the associated runtime (similar to Node), we don't need to keep
    std::string asString(Runtime& runtime);
    int64_t asBigInt(Runtime& runtime);
    std::string asSymbol(Runtime& runtime);
    // local_ref<JJSIObject::jhybridobject> asObject(Runtime& runtime);
    std::string toString(Runtime& runtime);

private:
    friend HybridBase;
    // needs to exist on heap to persist through JNI calls
    std::shared_ptr<Value> value_;
    // std::unique_ptr<facebook::jsi::Runtime> runtime_;
};
};
