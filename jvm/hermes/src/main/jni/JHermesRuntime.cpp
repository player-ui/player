#include "JHermesRuntime.h"

namespace intuit::playerui {

void JHermesConfig::registerNatives() {
    registerHybrid({
        makeNativeMethod("create", JHermesConfig::create),
    });
}


void JHermesRuntime::registerNatives() {
    registerHybrid({
        makeNativeMethod("create", JHermesRuntime::create),
        makeNativeMethod("create", JHermesRuntime::createWithConfig),

        makeNativeMethod("getConfig", JHermesRuntime::get_config),
        makeNativeMethod("evaluateJavaScriptWithSourceMap", JHermesRuntime::evaluateJavaScriptWithSourceMap),
    });
}

void JHermesRuntime::storeRef(void* ptr, facebook::jsi::Value &&value) {
    scope_[ptr] = std::make_unique<Value>(std::move(value));
}

Value* JHermesRuntime::getRef(void* ptr) {
    return *scope_[ptr];
}

void JHermesRuntime::clearRef(void* ptr) {
    scope_[ptr]
}
};
