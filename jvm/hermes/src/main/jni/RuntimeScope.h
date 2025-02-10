#pragma once

#include <jsi/jsi.h>
#include <set>
#include <unordered_map>
#include <variant>

using namespace std;
using namespace facebook::jsi;

namespace intuit::playerui {

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

    explicit RuntimeScope(): valueScope(make_unique<set<shared_ptr<Value>>>()), objectScope(make_unique<set<shared_ptr<Object>>>()), arrayScope(make_unique<set<shared_ptr<Array>>>()), functionScope(make_unique<set<shared_ptr<Function>>>()), symbolScope(make_unique<set<shared_ptr<Symbol>>>()){}
};
}