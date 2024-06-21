#pragma once

#include <hermes/hermes.h>
#include <fbjni/fbjni.h>

#include "jvm/hermes/src/main/cxx/HermesRuntimeHolder.hpp"

using namespace facebook::jni;

namespace intuit::playerui {

    class JHermesRuntime : HybridClass<JHermesRuntime> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/hermes/bridge/runtime/HermesRuntime;";

    static void registerNatives();
    static local_ref<jhybridobject> create(alias_ref<jclass>);

    JHermesRuntime() : runtime_(std::make_unique<HermesRuntimeHolder>(HermesRuntimeHolder())) {}

    // TODO: Wrap Value w/ HybridClass
    std::string execute(std::string script);

private:
    friend HybridBase;
    std::unique_ptr<HermesRuntimeHolder> runtime_;
};
};

