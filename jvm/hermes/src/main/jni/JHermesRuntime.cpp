#include "JHermesRuntime.h"

namespace intuit::playerui {

local_ref<JJSIValue::javaobject> JHermesRuntime::execute(std::string script) {
    Value result = runtime_->execute(script);
    // moving here is important to ensure we transfer ownership to the container
    return JJSIValue::newObjectCxxArgs(std::move(result));
}

void JHermesRuntime::registerNatives() {
    registerHybrid({
        // makeNativeMethod("initHybrid", JHermesRuntime::initHybrid),
        makeNativeMethod("create", JHermesRuntime::create),
        makeNativeMethod("execute", JHermesRuntime::execute),
    });
}
};
