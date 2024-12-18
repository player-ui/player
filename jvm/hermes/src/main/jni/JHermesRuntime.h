#pragma once

#include <hermes/hermes.h>
#include <fbjni/fbjni.h>

#include "RuntimeScope.h"
#include "JJSIValue.h"

using namespace facebook::hermes;

namespace intuit::playerui {

class JHermesConfig : public HybridClass<JHermesConfig> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/hermes/bridge/runtime/HermesRuntime$Config;";
    static void registerNatives();

    static local_ref<jhybridobject> create(alias_ref<jclass>, bool intl = true, bool microtaskQueue = false) {
        auto config = hermes::vm::RuntimeConfig::Builder()
            .withIntl(intl)
            .withES6Class(true)
            .withMicrotaskQueue(microtaskQueue)
            .build();

        return newObjectCxxArgs(std::move(config));
    }

    hermes::vm::RuntimeConfig& get_config() const {
        return *config_;
    }
private:
    friend HybridBase;
    std::unique_ptr<hermes::vm::RuntimeConfig> config_;
    explicit JHermesConfig(hermes::vm::RuntimeConfig&& config) : config_(std::make_unique<hermes::vm::RuntimeConfig>(config)) {}
};


class JHermesRuntime : public HybridClass<JHermesRuntime, JJSIRuntime> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/hermes/bridge/runtime/HermesRuntime;";
    static void registerNatives();

    static local_ref<jhybridobject> create(alias_ref<jclass>) {
        auto ref = newObjectCxxArgs();
        return ref;
    }

    static local_ref<jhybridobject> createWithConfig(alias_ref<jclass>, alias_ref<JHermesConfig::jhybridobject> config) {
        auto ref = newObjectCxxArgs(config);
        return ref;
    }

    // TODO: Add the rest of the HermesRuntime API (like loading bytecode)
    local_ref<JJSIValue::jhybridobject> evaluateJavaScriptWithSourceMap(std::string script, std::string sourceMap, std::string sourceURL) {
        auto result = JJSIValue::newObjectCxxArgs(this->runtimeScope_, get_runtime().evaluateJavaScriptWithSourceMap(std::make_shared<StringBuffer>(script), std::make_shared<StringBuffer>(sourceMap), sourceURL));
        return result;
    }

    ~JHermesRuntime() override {
        // make sure we release the runtime value holders that are not yet out of scope
        release();
    }

    void release() {
        for (auto& ptr : *runtimeScope_->valueScope) {
            ptr.second.reset();
        }
        for (auto& ptr : *runtimeScope_->objectScope) {
            ptr.second.reset();
        }
        for (auto& ptr : *runtimeScope_->functionScope) {
            ptr.second.reset();
        }
        for (auto& ptr : *runtimeScope_->arrayScope) {
            ptr.second.reset();
        }
        for (auto& ptr : *runtimeScope_->symbolScope) {
            ptr.second.reset();
        }
        if (jConfig_) jConfig_.reset();
        if (runtime_) runtime_.reset();
    }

    bool isReleased() {
        return runtime_ == nullptr;
    }

    HermesRuntime& get_runtime() override {
        if (runtime_) return *runtime_;

        throwNativeHandleReleasedException("HermesRuntime");
    }

    shared_ptr<RuntimeScope> get_scope() override {
        return runtimeScope_;
    }

    operator facebook::jsi::Runtime&() { return get_runtime(); }

    local_ref<JHermesConfig::jhybridobject> get_config() {
        if (jConfig_) return make_local(jConfig_);

        throwNativeHandleReleasedException("JHermesConfig");
    }

private:
    friend HybridBase;
    std::unique_ptr<HermesRuntime> runtime_;
    ::global_ref<JHermesConfig::jhybridobject> jConfig_;
    shared_ptr<RuntimeScope> runtimeScope_;
    explicit JHermesRuntime(
        std::unique_ptr<HermesRuntime> runtime,
        alias_ref<JHermesConfig::jhybridobject> jConfig
    ) : HybridClass(), runtime_(std::move(runtime)), jConfig_(make_global(jConfig)), runtimeScope_(make_shared<RuntimeScope>()) {}

    explicit JHermesRuntime(alias_ref<JHermesConfig::jhybridobject> jConfig) : JHermesRuntime(makeHermesRuntime(jConfig->cthis()->get_config()), jConfig) {}
    explicit JHermesRuntime() : JHermesRuntime(JHermesConfig::create(JHermesConfig::javaClassStatic())) {}
};

};
