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
        auto result = JJSIValue::newObjectCxxArgs(get_runtime().evaluateJavaScriptWithSourceMap(std::make_shared<StringBuffer>(script), std::make_shared<StringBuffer>(sourceMap), sourceURL));
        trackRef(result);
        return result;
    }

    void trackRef(alias_ref<JHybridClass::jhybridobject> ref) override {
        // TODO: Maybe we could do a periodic pruning of the vector to remove obsolete refs?
        scope_.push_back(make_weak(ref));
    }

    ~JHermesRuntime() override {
        // make sure we release the runtime value holders that are not yet out of scope
        release();
    }

    void release() {
        for (auto& weak : scope_) {
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
    explicit JHermesRuntime(
        std::unique_ptr<HermesRuntime> runtime,
        alias_ref<JHermesConfig::jhybridobject> jConfig
    ) : HybridClass(), runtime_(std::move(runtime)), jConfig_(make_global(jConfig)), scope_() {
        // TODO: Add dynamic fatal handler
        runtime->setFatalHandler([](const std::string& msg) {
            std::cout << "FATAL: " << msg << std::endl;
        });
    }

    explicit JHermesRuntime(alias_ref<JHermesConfig::jhybridobject> jConfig) : JHermesRuntime(makeHermesRuntime(jConfig->cthis()->get_config()), jConfig) {}
    explicit JHermesRuntime() : JHermesRuntime(JHermesConfig::create(JHermesConfig::javaClassStatic())) {}
};

};
