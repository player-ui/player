#include "com_intuit_playerui_hermes_bridge_runtime_HermesRuntimeImpl.h"

using namespace facebook::jni;

JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
    return initialize(vm, [] {
        intuit::playerui::JHermesRuntime::registerNatives();
    });
}
