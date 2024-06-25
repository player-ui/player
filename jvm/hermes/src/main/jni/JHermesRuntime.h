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
    static local_ref<jhybridobject> create(alias_ref<jclass>, bool intl, bool microtaskQueue) {
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
        return newObjectCxxArgs(config->cthis()->get_config());
    }

    // TODO: Add the rest of the HermesRuntime API

    Runtime& get_runtime() override {
        return *runtime_;
    }

    operator facebook::jsi::Runtime&() { return get_runtime(); }

private:
    friend HybridBase;
    std::unique_ptr<HermesRuntime> runtime_;
    explicit JHermesRuntime(std::unique_ptr<HermesRuntime> runtime) : HybridClass(), runtime_(std::move(runtime)) {}
    explicit JHermesRuntime(hermes::vm::RuntimeConfig& config) : JHermesRuntime(makeHermesRuntime(config)) {}
    explicit JHermesRuntime() : JHermesRuntime(makeHermesRuntime()) {}
};

};
