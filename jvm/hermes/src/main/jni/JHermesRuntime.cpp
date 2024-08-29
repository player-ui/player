#include "JHermesRuntime.h"

namespace intuit::playerui {

void JHermesConfig::registerNatives() {
    registerHybrid({
        makeNativeMethod("create", JHermesConfig::create),
    });
}


void JHermesRuntime::registerNatives() {
    registerHybrid({
        makeNativeMethod("create", JHermesRuntime::create),
        makeNativeMethod("create", JHermesRuntime::createWithConfig),

        makeNativeMethod("getConfig", JHermesRuntime::get_config),
        makeNativeMethod("evaluateJavaScriptWithSourceMap", JHermesRuntime::evaluateJavaScriptWithSourceMap),
    });
}

};
