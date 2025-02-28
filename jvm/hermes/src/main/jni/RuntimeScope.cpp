#include "RuntimeScope.h"
#include <jsi/jsi.h>
#include <stdexcept>
#include "iostream"

namespace intuit::playerui {

std::weak_ptr<Value> RuntimeScope::trackValue(Value value) {
    std::shared_ptr<Value> sp = make_shared<Value>(std::move(value));
    valueScope->insert(sp);
    std::weak_ptr<Value> wp = sp;
    return wp;
}

std::weak_ptr<Function> RuntimeScope::trackFunction(Function value) {
    std::shared_ptr<Function> sp = make_shared<Function>(std::move(value));
    functionScope->insert(sp);
    std::weak_ptr<Function> wp = sp;
    return wp;
}

std::weak_ptr<Array> RuntimeScope::trackArray(Array value) {
    std::shared_ptr<Array> sp = make_shared<Array>(std::move(value));
    arrayScope->insert(sp);
    std::weak_ptr<Array> wp = sp;
    return wp;
}

std::weak_ptr<Object> RuntimeScope::trackObject(Object value) {
    std::shared_ptr<Object> sp = make_shared<Object>(std::move(value));
    objectScope->insert(sp);
    std::weak_ptr<Object> wp = sp;
    return wp;
}

std::weak_ptr<Symbol> RuntimeScope::trackSymbol(Symbol value) {
    std::shared_ptr<Symbol> sp = make_shared<Symbol>(std::move(value));
    symbolScope->insert(sp);
    std::weak_ptr<Symbol> wp = sp;
    return wp;
}

}
