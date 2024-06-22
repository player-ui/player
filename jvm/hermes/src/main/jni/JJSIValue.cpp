#include "JJSIValue.h"
#include "ValueHelpers.h"

#include <iostream>

namespace intuit::playerui {

int JJSIValue::asInt() {
    // TODO: prefer as to bubble up to JVM -- but we're letting jsi tell us if it's actually an int
    //       maybe need to walk back this strategy to allow us to use null as a type signifier
    return static_cast<int>(value_->asNumber());
}

bool JJSIValue::asBool() {
    return value_->asBool();
}

void JJSIValue::registerNatives() {
    registerHybrid({
        makeNativeMethod("asInt", JJSIValue::asInt),
        makeNativeMethod("asBoolean", JJSIValue::asBool),
    });
}

};
