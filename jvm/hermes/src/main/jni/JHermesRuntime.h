#pragma once

#include <hermes/hermes.h>
#include <fbjni/fbjni.h>

#include "JJSIValue.h"

using namespace facebook::hermes;

namespace intuit::playerui {

class JHermesConfig : public HybridClass<JHermesConfig> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/hermes/bridge/runtime/HermesRuntime$Config;";
    static void registerNatives();

    // TODO: Expose the config options that make sense
    static local_ref<jhybridobject> create(alias_ref<jclass>, bool intl = true, bool microtaskQueue = false) {
        auto config = hermes::vm::RuntimeConfig::Builder()
            .withIntl(intl)
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
        return newObjectCxxArgs();
    }

    static local_ref<jhybridobject> createWithConfig(alias_ref<jclass>, alias_ref<JHermesConfig::jhybridobject> config) {
        return newObjectCxxArgs(config);
    }

    // TODO: Add the rest of the HermesRuntime API (like loading bytecode)
    local_ref<JJSIValue::jhybridobject> evaluateJavaScriptWithSourceMap(std::string script, std::string sourceMap, std::string sourceURL) {
        return JJSIValue::newObjectCxxArgs(get_runtime().evaluateJavaScriptWithSourceMap(std::make_shared<StringBuffer>(script), std::make_shared<StringBuffer>(sourceMap), sourceURL));
    }

    void trackRef(alias_ref<JHybridClass::jhybridobject> ref) override {
        scope_.push_back(make_weak(ref));
    }

    ~JHermesRuntime() override {
        // make sure we release in order, values before runtime
        release();
    }

    void release() {
        for (auto weak : scope_) {
            // // TODO: Maybe this'll work, but maybe we need to call into JVM to delete native pointer for hybrid class, which'll invoke the deleter and reset all smart pointers
            if (auto ref = weak.lockLocal()) ref->cthis()->release();
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

    operator facebook::jsi::Runtime&() { return get_runtime(); }

    local_ref<JHermesConfig::jhybridobject> get_config() {
        if (jConfig_) return make_local(jConfig_);

        throwNativeHandleReleasedException("JHermesConfig");
    }

private:
    friend HybridBase;
    std::unique_ptr<HermesRuntime> runtime_;
    global_ref<JHermesConfig::jhybridobject> jConfig_;
    std::vector<weak_ref<JHybridClass::jhybridobject>> scope_;
    explicit JHermesRuntime(std::unique_ptr<HermesRuntime> runtime, alias_ref<JHermesConfig::jhybridobject> jConfig) : HybridClass(), runtime_(std::move(runtime)), jConfig_(make_global(jConfig)), scope_() {
        // TODO: Add dynamic fatal handler
        runtime->setFatalHandler([](const std::string& msg) {
            std::cout << "FATAL: " << msg << std::endl;
        });
    }

    explicit JHermesRuntime(alias_ref<JHermesConfig::jhybridobject> jConfig) : JHermesRuntime(makeHermesRuntime(jConfig->cthis()->get_config()), jConfig) {}
    explicit JHermesRuntime() : JHermesRuntime(JHermesConfig::create(JHermesConfig::javaClassStatic())) {}
};

};
