#include <hermes/hermes.h>

#include "JHermesRuntime.h"
#include "JJSIValue.h"

namespace intuit::playerui {

facebook::jni::local_ref<JJSIValue::javaobject> JHermesRuntime::execute(std::string script) {
    facebook::jsi::Value result = runtime_->execute(script);
    // moving here is important to ensure we transfer ownership to the container
    return JJSIValue::newObjectCxxArgs(std::move(result));
}

void JHermesRuntime::registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", JHermesRuntime::initHybrid),
        makeNativeMethod("execute", JHermesRuntime::execute),
    });
}
};
