#pragma once

#include <iostream>
#include <jsi/jsi.h>
#include <fbjni/fbjni.h>

namespace intuit::playerui {

    class JJSIValue : public facebook::jni::HybridClass<JJSIValue> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/hermes/bridge/JSIValue;";

    static void registerNatives();

    explicit JJSIValue(
        // TODO: Probably need to maintain runtime reference for value apis
        // std::unique_ptr<facebook::jsi::Runtime> runtime,
        facebook::jsi::Value&& value
    ) :
        // runtime_(std::move(runtime)),
        value_(std::make_shared<facebook::jsi::Value>(std::move(value))) {}

    int asInt();

    bool asBool();

private:
    friend HybridBase;
    // needs to exist on heap to persist through JNI calls
    std::shared_ptr<facebook::jsi::Value> value_;
    // std::unique_ptr<facebook::jsi::Runtime> runtime_;
};
};
