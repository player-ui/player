#include "RuntimeScope.h"
#include <jsi/jsi.h>
#include <stdexcept>
#include "iostream"

namespace intuit::playerui {

//template<typename T>
void RuntimeScope::trackValue(void* ptr, Value value) {
    std::cout << "=====" << std::endl;
    std::cout << ptr << std::endl;
    std::cout << &value << std::endl;
    valueScope->insert({ptr, make_unique<Value>(std::move(value))});
    //std::cout << valueScope->at(ptr).get() << std::endl;
    std::cout << "=====" << std::endl;
}

void RuntimeScope::trackFunction(void* ptr, Function value) {
    functionScope->insert({ptr, make_unique<Function>(std::move(value))});
}

void RuntimeScope::trackArray(void *ptr, facebook::jsi::Array value) {
    arrayScope->insert({ptr, make_unique<Array>(std::move(value))});
}

void RuntimeScope::trackObject(void *ptr, facebook::jsi::Object value) {
    objectScope->insert({ptr, make_unique<Object>(std::move(value))});
}

void RuntimeScope::trackSymbol(void *ptr, facebook::jsi::Symbol value) {
    symbolScope->insert({ptr, make_unique<Symbol>(std::move(value))});
}

Value* RuntimeScope::getValue(void* ptr) {
    std::cout << "++++" << std::endl;
    std::cout << ptr << std::endl;
    //std::cout << valueScope->at(ptr).get() << std::endl;
    std::cout << "++++" << std::endl;
    auto it = valueScope->find(ptr);
    if (it != valueScope->end()) {
        return valueScope->at(ptr).get();
    } else {
        std::cout << "&&&&&&&&&Value" << std::endl;
        std::cout << ptr << std::endl;
        throw std::runtime_error("'above ptr not found in map.");
    }
}

Object* RuntimeScope::getObject(void *ptr) {
    auto it = objectScope->find(ptr);
    if (it != objectScope->end()) {
        return objectScope->at(ptr).get();
    } else {
        std::cout << "&&&&&&&&&Object" << std::endl;
        std::cout << ptr << std::endl;
        auto hmm = functionScope->find(ptr);
        auto hmmm = arrayScope->find(ptr);
        if (hmm != functionScope->end()){
            std::cout << "found in functionScope" << std::endl;
            return functionScope->at(ptr).get();
        }
        if (hmmm != arrayScope->end()) {
            std::cout << "found in arrayScope" << std::endl;
            return arrayScope->at(ptr).get();
        }
        throw std::runtime_error("'above ptr not found in objectScope.");
    }
}

Function* RuntimeScope::getFunction(void *ptr) {
    auto it = functionScope->find(ptr);
    if (it != functionScope->end()) {
        return functionScope->at(ptr).get();
    } else {
        std::cout << "&&&&&&&&&Function" << std::endl;
        std::cout << ptr << std::endl;
        throw std::runtime_error("'above ptr not found in map.");
    }
}

Array* RuntimeScope::getArray(void *ptr) {
    auto it = arrayScope->find(ptr);
    if (it != arrayScope->end()) {
        return arrayScope->at(ptr).get();
    } else {
        std::cout << "&&&&&&&&&Array" << std::endl;
        std::cout << ptr << std::endl;
        throw std::runtime_error("'above ptr not found in map.");
    }
}

Symbol* RuntimeScope::getSymbol(void *ptr) {
    auto it = symbolScope->find(ptr);
    if (it != symbolScope->end()) {
        return symbolScope->at(ptr).get();
    } else {
        std::cout << "&&&&&&&&&Symbol" << std::endl;
        std::cout << ptr << std::endl;
        throw std::runtime_error("'above ptr not found in map.");
    }
}

void RuntimeScope::clearRef(void* ptr) {
    if (valueScope->find(ptr) != valueScope->end()) {
        std::cout << "CLEARING REF" << std::endl;
        std::cout << ptr << std::endl;
        valueScope->at(ptr).reset();
        valueScope->erase(ptr);
    }
    if (objectScope->find(ptr) != objectScope->end()) {
        objectScope->at(ptr).reset();
        objectScope->erase(ptr);
    }
    if (functionScope->find(ptr) != functionScope->end()) {
        functionScope->at(ptr).reset();
        functionScope->erase(ptr);
    }
    if (arrayScope->find(ptr) != arrayScope->end()) {
        arrayScope->at(ptr).reset();
        arrayScope->erase(ptr);
    }
    if (symbolScope->find(ptr) != symbolScope->end()) {
        symbolScope->at(ptr).reset();
        symbolScope->erase(ptr);
    }
}

}
