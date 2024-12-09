#pragma once

#include <hermes/hermes.h>
#include <fbjni/fbjni.h>

#include "JJSIValue.h"

using namespace facebook::hermes;

namespace intuit::playerui {

class JHermesConfig : public HybridClass<JHermesConfig> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/hermes/bridge/runtime/HermesRuntime$Config;";
    static void registerNatives();

    static local_ref<jhybridobject> create(alias_ref<jclass>, bool intl = true, bool microtaskQueue = false) {
        auto config = hermes::vm::RuntimeConfig::Builder()
            .withIntl(intl)
            .withES6Class(true)
            .withMicrotaskQueue(microtaskQueue)
            .build();

        return newObjectCxxArgs(std::move(config));
    }

    hermes::vm::RuntimeConfig& get_config() const {
        return *config_;
    }
private:
    friend HybridBase;
    std::unique_ptr<hermes::vm::RuntimeConfig> config_;
    explicit JHermesConfig(hermes::vm::RuntimeConfig&& config) : config_(std::make_unique<hermes::vm::RuntimeConfig>(config)) {}
};


class JHermesRuntime : public HybridClass<JHermesRuntime, JJSIRuntime> {
public:
    static constexpr auto kJavaDescriptor = "Lcom/intuit/playerui/hermes/bridge/runtime/HermesRuntime;";
    static void registerNatives();

    static local_ref<jhybridobject> create(alias_ref<jclass>) {
        auto ref = newObjectCxxArgs();
        ref->cthis()->global_ref = make_global(ref);
        return ref;
    }

    static local_ref<jhybridobject> createWithConfig(alias_ref<jclass>, alias_ref<JHermesConfig::jhybridobject> config) {
        auto ref = newObjectCxxArgs();
        //something = make_global(ref)
        return ref;
    }

    // TODO: Add the rest of the HermesRuntime API (like loading bytecode)
    local_ref<JJSIValue::jhybridobject> evaluateJavaScriptWithSourceMap(std::string script, std::string sourceMap, std::string sourceURL) {
        auto result = JJSIValue::newObjectCxxArgs(get_runtime().evaluateJavaScriptWithSourceMap(std::make_shared<StringBuffer>(script), std::make_shared<StringBuffer>(sourceMap), sourceURL));
        trackRef(result);
        return result;
    }

    void trackRef(alias_ref<JHybridClass::jhybridobject> ref) override {
        // TODO: From my current understanding, holding a global prevents the class from being
        //       GC'd when it goes out of scope in Java land, which would prevent the JSI Value reference
        //       from being reset. I originally wanted to keep a weak_ref, but was getting intermittent
        //       segfaults from untracked (or incorrectly tracked) references that were then not being
        //       released because the weak_ref was out of scope. The assumption there was that if the
        //       weak_ref was out of scope, it was already released. But this doesn't seem to be true,
        //       otherwise we wouldn't be getting segfaults. Making them global does prevent the segfaults,
        //       reaffirming the above. Since all the wrapper classes are holding are pointers
        //       this probably isn't a huge deal, but is certainly an inefficiency we should look
        //       to remove.

        //       I'd like to just create weak_ptrs on the JSI values themselves,
        //       which requires the holders to use shared_ptrs and expose a getter for accessing.
        //       Then we'd also need a way to hold arbitrary weak_ptrs. We could also maybe try
        //       to get weak refs to _just_ the CXX parts of the hybrid class to avoid leaking things
        //       on the JVM side?
        // TODO: Maybe we could do a periodic pruning of the vector to remove obsolete refs?
        scope_.push_back(make_weak(ref));
    }

    void storeRef(void* ptr, Value &&value) override;

    Value* getRef(void* ptr) override;

    voi

    ~JHermesRuntime() override {
        // make sure we release the runtime value holders that are not yet out of scope
        release();
    }

    void release() {
        for (auto& weak : scope_) {
            if (auto ref = weak.lockLocal()) ref->cthis()->release();
        }
        if (jConfig_) jConfig_.reset();
        if (runtime_) runtime_.reset();
    }

    bool isReleased() {
        return runtime_ == nullptr;
    }

    HermesRuntime& get_runtime() override {
        if (runtime_) return *runtime_;

        throwNativeHandleReleasedException("HermesRuntime");
    }

    operator facebook::jsi::Runtime&() { return get_runtime(); }

    local_ref<JHermesConfig::jhybridobject> get_config() {
        if (jConfig_) return make_local(jConfig_);

        throwNativeHandleReleasedException("JHermesConfig");
    }

private:
    friend HybridBase;
    std::unique_ptr<HermesRuntime> runtime_;
    global_ref<JHermesConfig::jhybridobject> jConfig_;
    std::unordered_map<void*, unique_ptr<Value>> scope_;
    explicit JHermesRuntime(
        std::unique_ptr<HermesRuntime> runtime,
        alias_ref<JHermesConfig::jhybridobject> jConfig
    ) : HybridClass(), runtime_(std::move(runtime)), jConfig_(make_global(jConfig)), scope_() {}

    explicit JHermesRuntime(alias_ref<JHermesConfig::jhybridobject> jConfig) : JHermesRuntime(makeHermesRuntime(jConfig->cthis()->get_config()), jConfig) {}
    explicit JHermesRuntime() : JHermesRuntime(JHermesConfig::create(JHermesConfig::javaClassStatic())) {}
};

};
