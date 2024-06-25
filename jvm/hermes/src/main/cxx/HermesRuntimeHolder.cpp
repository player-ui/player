#include <hermes/hermes.h>
#include "HermesRuntimeHolder.hpp"

#include <iostream>
#include <exception>

namespace intuit::playerui {

    static hermes::vm::RuntimeConfig DefaultConfig = ::hermes::vm::RuntimeConfig::Builder()
        .withIntl(false)
        .build();

    HermesRuntimeHolder::HermesRuntimeHolder() : HermesRuntimeHolder(DefaultConfig) {
        std::cout << "some metadata: " << get_runtime().description() << std::endl;
    }

    HermesRuntimeHolder::HermesRuntimeHolder(
        hermes::vm::RuntimeConfig &config
    ) : HermesRuntimeHolder(
        config,
        facebook::hermes::makeHermesRuntime(config)
    ) {}

    facebook::jsi::Value HermesRuntimeHolder::execute(const std::string& script, const std::string& sourceURL) const {
        facebook::jsi::Runtime& runtime = get_runtime();
        const auto buffered = std::make_shared<facebook::jsi::StringBuffer>(script);
        std::cout << "Executing: " << script << std::endl;
        // TODO: This is expensive - replace with other construct
        facebook::jsi::Value result = runtime.evaluateJavaScript(buffered, sourceURL);
        std::cout << "Result: " << result.toString(runtime).utf8(runtime) << std::endl;
        return result;
    }
};
