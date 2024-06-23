#include "JHermesRuntime.h"

using namespace facebook::jni;

JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
    return initialize(vm, [] {
        intuit::playerui::JJSIRuntime::registerNatives();
        intuit::playerui::JJSIValue::registerNatives();
        intuit::playerui::JJSIObject::registerNatives();
        intuit::playerui::JJSIArray::registerNatives();
        intuit::playerui::JJSIFunction::registerNatives();
        intuit::playerui::JJSISymbol::registerNatives();
        intuit::playerui::JHermesRuntime::registerNatives();
    });
}
