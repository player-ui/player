#pragma once

#include <iostream>
#include <hermes/hermes.h>

namespace intuit::playerui {

// Executor - TODO: It's possible we want to extend jsi::Runtime and delegate through a runtime instance
class HermesRuntimeHolder {
public:
    HermesRuntimeHolder();
    explicit HermesRuntimeHolder(hermes::vm::RuntimeConfig &config);

    facebook::jsi::Value execute(const std::string& script, const std::string& sourceURL = "unknown.js") const;

    void release();

    facebook::hermes::HermesRuntime* runtime;

    operator facebook::jsi::Runtime&() const {
        return *runtime;
    }

private:
    // TODO: Maybe these should be unique_ptrs
    hermes::vm::RuntimeConfig* config_;

    HermesRuntimeHolder(hermes::vm::RuntimeConfig &config, facebook::hermes::HermesRuntime &runtime) {
        this->config_ = &config;
        this->runtime = &runtime;

        std::cout << "Primary constructor\nConfig: " << this->config_ << "\nRuntime: " << this->runtime->description() << std::endl;
    }
};

}
