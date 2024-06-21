#include <hermes/hermes.h>

#include "com_intuit_playerui_hermes_bridge_runtime_HermesRuntimeImpl.h"

using namespace facebook;

namespace intuit::playerui {

std::string JHermesRuntime::execute(std::string script) {
    jsi::Value result = runtime_->execute(script);
    return result.toString(*runtime_).utf8(*runtime_);
}

jni::local_ref<JHermesRuntime::jhybridobject> JHermesRuntime::create(jni::alias_ref<jclass>) {
    // throw HermesRuntimeException("u wot m8?");
    // TODO: Verify we should make_global, and how to track references
    // static auto instance = jni::make_global();
    return newObjectCxxArgs();
}

void JHermesRuntime::registerNatives() {
//     registerHybrid({
//         makeNativeMethod("execute", JHermesRuntime::execute),
// //            makeNativeMethod("execute", JHermesRuntime::execute, "Ljava/lang/String;")
//     });
     javaClassStatic()->registerNatives( {
         makeNativeMethod("create", JHermesRuntime::create),
     });
}

//    // TODO: Maybe externalize
//extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void*) {
//    return initialize(vm, [] {
//        throw std::runtime_error("help");
//        JHermesRuntime::registerNatives();
//    });
//}

};
