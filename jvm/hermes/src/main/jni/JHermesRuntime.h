#pragma once

#include <hermes/hermes.h>
#include <fbjni/fbjni.h>

#include "jvm/hermes/src/main/cxx/HermesRuntimeHolder.hpp"
#include "JJSIValue.h"


namespace intuit::playerui {
    // TODO: Can I push a lot of the common impls to JJSIRuntime and just provide a Hermes constructor?
    class JHermesRuntime : public HybridClass<JHermesRuntime, JJSIRuntime> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/hermes/bridge/runtime/HermesRuntime;";

    static void registerNatives();

    static local_ref<jhybridobject> create(alias_ref<jclass>) {
        return newObjectCxxArgs();
    }

    static local_ref<jhybriddata> initHybrid(alias_ref<jhybridobject>) {
        return makeCxxInstance();
    }

    local_ref<JJSIValue::javaobject> execute(std::string script);

    Runtime& get_runtime() override {
        return runtime_->get_runtime();
    }

    operator facebook::jsi::Runtime&() const { return runtime_->get_runtime(); }

private:
    friend HybridBase;
    std::unique_ptr<HermesRuntimeHolder> runtime_;
    JHermesRuntime() : HybridClass(), runtime_(std::make_unique<HermesRuntimeHolder>(HermesRuntimeHolder())) {}
};
};
