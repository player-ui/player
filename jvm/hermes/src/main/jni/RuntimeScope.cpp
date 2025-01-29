#include "RuntimeScope.h"
#include <jsi/jsi.h>
#include <stdexcept>
#include "iostream"

namespace intuit::playerui {

std::weak_ptr<Value> RuntimeScope::trackValue(Value value) {
    std::shared_ptr<Value> sp = make_shared<Value>(std::move(value));
    valueScope->insert(sp);
    weak_ptr wp = sp;
    return wp;
}

std::weak_ptr<Function> RuntimeScope::trackFunction(Function value) {
    std::shared_ptr<Function> sp = make_shared<Function>(std::move(value));
    functionScope->insert(sp);
    weak_ptr wp = sp;
    return wp;
}

std::weak_ptr<facebook::jsi::Array> RuntimeScope::trackArray(facebook::jsi::Array value) {
    std::shared_ptr<facebook::jsi::Array> sp = make_shared<facebook::jsi::Array>(std::move(value));
    arrayScope->insert(sp);
    weak_ptr wp = sp;
    return wp;
}

std::weak_ptr<facebook::jsi::Object> RuntimeScope::trackObject(facebook::jsi::Object value) {
    std::shared_ptr<facebook::jsi::Object> sp = make_shared<facebook::jsi::Object>(std::move(value));
    objectScope->insert(sp);
    weak_ptr wp = sp;
    return wp;
}

std::weak_ptr<facebook::jsi::Symbol> RuntimeScope::trackSymbol(facebook::jsi::Symbol value) {
    std::shared_ptr<facebook::jsi::Symbol> sp = make_shared<facebook::jsi::Symbol>(std::move(value));
    symbolScope->insert(sp);
    weak_ptr wp = sp;
    return wp;
}

}
