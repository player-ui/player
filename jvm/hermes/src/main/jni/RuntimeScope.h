#pragma once

#include <jsi/jsi.h>
#include <unordered_map>
#include <variant>

using namespace std;
using namespace facebook::jsi;

namespace intuit::playerui {
// Define the supported types for the variant
using VariantType = variant<Value, Object, Array, Function, Symbol>;

class RuntimeScope {
public:
    unique_ptr<unordered_map<void*, unique_ptr<Value>>> valueScope;
    unique_ptr<unordered_map<void*, unique_ptr<Object>>> objectScope;
    unique_ptr<unordered_map<void*, unique_ptr<Array>>> arrayScope;
    unique_ptr<unordered_map<void*, unique_ptr<Function>>> functionScope;
    unique_ptr<unordered_map<void*, unique_ptr<Symbol>>> symbolScope;

    std::shared_ptr<Value> trackValue(Value value);

    std::shared_ptr<Function> trackFunction(Function value);

    std::shared_ptr<Object> trackObject(Object value);

    std::shared_ptr<Array> trackArray(Array value);

    std::shared_ptr<Symbol> trackSymbol(Symbol value);

    Value* getValue(void* ptr);

    Function* getFunction(void* ptr);

    Array* getArray(void* ptr);

    Object* getObject(void* ptr);

    Symbol* getSymbol(void* ptr);

    void clearRef(void* ptr);

    explicit RuntimeScope(): valueScope(make_unique<unordered_map<void*, unique_ptr<Value>>>()), objectScope(make_unique<unordered_map<void*, unique_ptr<Object>>>()), arrayScope(make_unique<unordered_map<void*, unique_ptr<Array>>>()), functionScope(make_unique<unordered_map<void*, unique_ptr<Function>>>()), symbolScope(make_unique<unordered_map<void*, unique_ptr<Symbol>>>()){}
};
}