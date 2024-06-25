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
        // TODO: Maybe have to move? Or just make global?
        return newObjectCxxArgs(config);
    }

    // TODO: Add the rest of the HermesRuntime API
    // TODO: Add release API - would likely just release the pointer

    Runtime& get_runtime() override {
        return *runtime_;
    }

    operator facebook::jsi::Runtime&() { return get_runtime(); }

    local_ref<JHermesConfig::jhybridobject> get_config() {
        return make_local(jConfig_);
    }

private:
    friend HybridBase;
    std::unique_ptr<HermesRuntime> runtime_;
    global_ref<JHermesConfig::jhybridobject> jConfig_;
    explicit JHermesRuntime(std::unique_ptr<HermesRuntime> runtime, alias_ref<JHermesConfig::jhybridobject> jConfig) : HybridClass(), runtime_(std::move(runtime)), jConfig_(make_global(jConfig)) {}
    explicit JHermesRuntime(alias_ref<JHermesConfig::jhybridobject> jConfig) : JHermesRuntime(makeHermesRuntime(jConfig->cthis()->get_config()), jConfig) {}
    explicit JHermesRuntime() : JHermesRuntime(JHermesConfig::create(JHermesConfig::javaClassStatic())) {}
};

};
