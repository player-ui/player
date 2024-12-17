#pragma once

#ifndef REFTRACKER_H
#define REFTRACKER_H

#include <jsi/jsi.h>
#include <unordered_map>
#include <variant>
#include "JJSIValue.h"

using namespace std;
using namespace facebook::jsi;

namespace intuit::playerui {
// Define the supported types for the variant
using VariantType = variant<Value, Object, Array, Function>;

class RuntimeScope {
private:
    unordered_map<void *, unique_ptr<VariantType>> scope;

public:
    void trackRef(void* ptr, VariantType value);

    VariantType& getRef(void* ptr);

    void clearRef(void* ptr);
};
}
#endif // REFTRACKER_H