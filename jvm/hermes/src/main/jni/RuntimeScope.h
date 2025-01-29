#pragma once

#include <jsi/jsi.h>
#include <set>
#include <unordered_map>
#include <variant>

using namespace std;
using namespace facebook::jsi;

namespace intuit::playerui {
// Define the supported types for the variant
using VariantType = variant<Value, Object, Array, Function, Symbol>;

class RuntimeScope {
public:
    unique_ptr<set<shared_ptr<Value>>> valueScope;
    unique_ptr<set<shared_ptr<Object>>> objectScope;
    unique_ptr<set<shared_ptr<Array>>> arrayScope;
    unique_ptr<set<shared_ptr<Function>>> functionScope;
    unique_ptr<set<shared_ptr<Symbol>>> symbolScope;

    std::weak_ptr<Value> trackValue(Value value);

    std::weak_ptr<Function> trackFunction(Function value);

    std::weak_ptr<Object> trackObject(Object value);

    std::weak_ptr<Array> trackArray(Array value);

    std::weak_ptr<Symbol> trackSymbol(Symbol value);

    Value* getValue(void* ptr);

    Function* getFunction(void* ptr);

    Array* getArray(void* ptr);

    Object* getObject(void* ptr);

    Symbol* getSymbol(void* ptr);

/*    void clearSymbol(weak_ptr<Symbol> ptr);

    void clearObject(weak_ptr<Object> ptr);

    void clearArray(weak_ptr<Array> ptr);

    void clearValue(weak_ptr<Value> ptr);

    void clearFunction(weak_ptr<Function> ptr);*/

    explicit RuntimeScope(): valueScope(make_unique<set<shared_ptr<Value>>>()), objectScope(make_unique<set<shared_ptr<Object>>>()), arrayScope(make_unique<set<shared_ptr<Array>>>()), functionScope(make_unique<set<shared_ptr<Function>>>()), symbolScope(make_unique<set<shared_ptr<Symbol>>>()){}
};
}