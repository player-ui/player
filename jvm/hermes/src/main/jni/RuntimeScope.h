#pragma once

#include <jsi/jsi.h>
#include <unordered_map>
#include <variant>

using namespace std;
using namespace facebook::jsi;

namespace intuit::playerui {
// Define the supported types for the variant
using VariantType = variant<Value, Object, Array, Function>;

class RuntimeScope {
public:
    unique_ptr<unordered_map<void*, unique_ptr<VariantType>>> scope;

    void trackRef(void* ptr, VariantType value);

    VariantType* getRef(void* ptr);

    void clearRef(void* ptr);

    explicit RuntimeScope(): scope(make_unique<unordered_map<void*, unique_ptr<VariantType>>>()){}
};
}