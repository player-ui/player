#include "RuntimeScope.h"
#include <jsi/jsi.h>
#include <stdexcept>
#include "iostream"

namespace intuit::playerui {

std::weak_ptr<VariantType> RuntimeScope::trackValue(Value value) {
    std::shared_ptr<VariantType> sp = make_shared<VariantType>(std::move(value));
    sharedScope->push_back(sp);
    std::weak_ptr<VariantType> wp = sp;
    return wp;
}

std::weak_ptr<VariantType> RuntimeScope::trackFunction(Function value) {
    std::shared_ptr<VariantType> sp = make_shared<VariantType>(std::move(value));
    sharedScope->push_back(sp);
    std::weak_ptr<VariantType> wp = sp;
    return wp;
}

std::weak_ptr<VariantType> RuntimeScope::trackArray(Array value) {
    std::shared_ptr<VariantType> sp = make_shared<VariantType>(std::move(value));
    sharedScope->push_back(sp);
    std::weak_ptr<VariantType> wp = sp;
    return wp;
}

std::weak_ptr<VariantType> RuntimeScope::trackObject(Object value) {
    std::shared_ptr<VariantType> sp = make_shared<VariantType>(std::move(value));
    sharedScope->push_back(sp);
    std::weak_ptr<VariantType> wp = sp;
    return wp;
}

std::weak_ptr<VariantType> RuntimeScope::trackSymbol(Symbol value) {
    std::shared_ptr<VariantType> sp = make_shared<VariantType>(std::move(value));
    sharedScope->push_back(sp);
    std::weak_ptr<VariantType> wp = sp;
    return wp;
}

}
