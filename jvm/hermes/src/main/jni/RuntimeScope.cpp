#include "RuntimeScope.h"
#include <jsi/jsi.h>
#include <stdexcept>
#include "iostream"

namespace intuit::playerui {

//template<typename T>
std::shared_ptr<Value> RuntimeScope::trackValue(std::weak_ptr<Value>& wp, Value value) {
    std::shared_ptr<Value> sp = make_shared<Value>(std::move(value));
    wp = sp;
        if (auto lock = wp.lock()) {
            std::cout << "THIS IS DOING SOMETHING" << std::endl;
            std::cout << lock << std::endl;
        }
        return sp;
    //valueScope->insert({ptr, make_unique<Value>(std::move(value))});
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
    auto it = valueScope->find(ptr);
    if (it != valueScope->end()) {
        return valueScope->at(ptr).get();
    }
    return nullptr;
}

Object* RuntimeScope::getObject(void *ptr) {
    if (objectScope->find(ptr) != objectScope->end()) {
        return objectScope->at(ptr).get();
    } else if (functionScope->find(ptr) != functionScope->end()) {
        return functionScope->at(ptr).get();
    } else if (arrayScope->find(ptr) != arrayScope->end()) {
        return arrayScope->at(ptr).get();
    }
    return nullptr;
}

Function* RuntimeScope::getFunction(void *ptr) {
    auto it = functionScope->find(ptr);
    if (it != functionScope->end()) {
        return functionScope->at(ptr).get();
    }
    return nullptr;
}

Array* RuntimeScope::getArray(void *ptr) {
    auto it = arrayScope->find(ptr);
    if (it != arrayScope->end()) {
        return arrayScope->at(ptr).get();
    }
    return nullptr;
}

Symbol* RuntimeScope::getSymbol(void *ptr) {
    auto it = symbolScope->find(ptr);
    if (it != symbolScope->end()) {
        return symbolScope->at(ptr).get();
    }
    return nullptr;
}

void RuntimeScope::clearRef(void* ptr) {
    if (valueScope->find(ptr) != valueScope->end()) {
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
