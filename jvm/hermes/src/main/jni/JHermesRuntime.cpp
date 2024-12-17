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

void JHermesRuntime::storeRef(void* ptr, std::variant<Value, Object, Array, Function> value) {
    scope_[ptr] = std::make_unique<std::variant<Value, Object, Array, Function>>(std::move(value));
}

std::variant<Value, Object, Array, Function>& JHermesRuntime::getRef(void* ptr) {
    return *scope_[ptr];
}

void JHermesRuntime::clearRef(void* ptr) {
    scope_[ptr] = nullptr;
}
};
