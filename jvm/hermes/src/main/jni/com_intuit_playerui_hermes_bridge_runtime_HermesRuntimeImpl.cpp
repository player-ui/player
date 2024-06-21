#include <hermes/hermes.h>

#include "com_intuit_playerui_hermes_bridge_runtime_HermesRuntimeImpl.h"

namespace intuit::playerui {

std::string JHermesRuntime::execute(std::string script) {
    facebook::jsi::Value result = runtime_->execute(script);
    return result.toString(*runtime_).utf8(*runtime_);
}

void JHermesRuntime::registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", JHermesRuntime::initHybrid),
        makeNativeMethod("execute", JHermesRuntime::execute),
    });
}
};
