#include "RuntimeScope.h"
#include <stdexcept>
#include "iostream"

namespace intuit::playerui {

void RuntimeScope::trackRef(void* ptr, VariantType value) {
    std::cout << "=====" << std::endl;
    std::cout << ptr << std::endl;
    std::cout << &value << std::endl;
    scope->insert({ptr, make_unique<VariantType>(std::move(value))});
    std::cout << scope->at(ptr).get() << std::endl;
    std::cout << "=====" << std::endl;
}

VariantType* RuntimeScope::getRef(void* ptr) {
    std::cout << "++++" << std::endl;
    std::cout << ptr << std::endl;
    std::cout << scope->at(ptr).get() << std::endl;
    std::cout << "++++" << std::endl;
    return scope->at(ptr).get();
}

void RuntimeScope::clearRef(void* ptr) {
    scope->at(ptr).reset();
}

}
