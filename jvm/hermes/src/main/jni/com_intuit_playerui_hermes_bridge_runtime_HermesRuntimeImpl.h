#pragma once

#include <hermes/hermes.h>
#include <fbjni/fbjni.h>

#include "jvm/hermes/src/main/cxx/HermesRuntimeHolder.hpp"

namespace intuit::playerui {

    class JHermesRuntime : public facebook::jni::HybridClass<JHermesRuntime> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/hermes/bridge/runtime/HermesRuntime;";

    static void registerNatives();

    static facebook::jni::local_ref<jhybriddata> initHybrid(facebook::jni::alias_ref<jhybridobject>) {
        return makeCxxInstance();
    }

    // TODO: Wrap Value w/ HybridClass
    std::string execute(std::string script);

private:
    friend HybridBase;
    std::unique_ptr<HermesRuntimeHolder> runtime_;
    JHermesRuntime() : runtime_(std::make_unique<HermesRuntimeHolder>(HermesRuntimeHolder())) {}
};
};
