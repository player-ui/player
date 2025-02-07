#pragma once

#include <jsi/jsi.h>
#include <vector>
#include <variant>

using namespace std;
using namespace facebook::jsi;

namespace intuit::playerui {

using VariantType = variant<Value, Object, Array, Function, Symbol>;

class RuntimeScope {
public:
    unique_ptr<vector<shared_ptr<VariantType>>> sharedScope;

    std::weak_ptr<VariantType> trackValue(Value value);

    std::weak_ptr<VariantType> trackFunction(Function value);

    std::weak_ptr<VariantType> trackObject(Object value);

    std::weak_ptr<VariantType> trackArray(Array value);

    std::weak_ptr<VariantType> trackSymbol(Symbol value);

    explicit RuntimeScope(): sharedScope(make_unique<vector<shared_ptr<VariantType>>>()){}
};
}