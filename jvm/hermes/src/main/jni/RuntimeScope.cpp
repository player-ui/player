#include "RuntimeScope.h"
#include <jsi/jsi.h>
#include <stdexcept>
#include "iostream"

namespace intuit::playerui {

//template<typename T>
std::shared_ptr<Value> RuntimeScope::trackValue(Value value) {
    std::shared_ptr<Value> sp = make_shared<Value>(std::move(value));
    //valueScope->insert(sp);
    return sp;
}

std::shared_ptr<Function> RuntimeScope::trackFunction(Function value) {
    std::shared_ptr<Function> sp = make_shared<Function>(std::move(value));
    //functionScope->insert(sp);
    return sp;
}

std::shared_ptr<facebook::jsi::Array> RuntimeScope::trackArray(facebook::jsi::Array value) {
    std::shared_ptr<facebook::jsi::Array> sp = make_shared<facebook::jsi::Array>(std::move(value));
    //arrayScope->insert(sp);
    return sp;
}

std::shared_ptr<facebook::jsi::Object> RuntimeScope::trackObject(facebook::jsi::Object value) {
    std::shared_ptr<facebook::jsi::Object> sp = make_shared<facebook::jsi::Object>(std::move(value));
    //objectScope->insert(sp);
    return sp;
}

std::shared_ptr<facebook::jsi::Symbol> RuntimeScope::trackSymbol(facebook::jsi::Symbol value) {
    std::shared_ptr<facebook::jsi::Symbol> sp = make_shared<facebook::jsi::Symbol>(std::move(value));
    //symbolScope->insert(sp);
    return sp;
}

Value* RuntimeScope::getValue(void* ptr) {
/*    auto it = valueScope->find(ptr);
    if (it != valueScope->end()) {
        return valueScope->at(ptr).get();
    }
    return nullptr;*/
}

Object* RuntimeScope::getObject(void *ptr) {
/*    if (objectScope->find(ptr) != objectScope->end()) {
        return objectScope->at(ptr).get();
    } else if (functionScope->find(ptr) != functionScope->end()) {
        return functionScope->at(ptr).get();
    } else if (arrayScope->find(ptr) != arrayScope->end()) {
        return arrayScope->at(ptr).get();
    }*/
    return nullptr;
}

Function* RuntimeScope::getFunction(void *ptr) {
/*    auto it = functionScope->find(ptr);
    if (it != functionScope->end()) {
        return functionScope->at(ptr).get();
    }*/
    return nullptr;
}

Array* RuntimeScope::getArray(void *ptr) {
/*    auto it = arrayScope->find(ptr);
    if (it != arrayScope->end()) {
        return arrayScope->at(ptr).get();
    }*/
    return nullptr;
}

Symbol* RuntimeScope::getSymbol(void *ptr) {
/*    auto it = symbolScope->find(ptr);
    if (it != symbolScope->end()) {
        return symbolScope->at(ptr).get();
    }*/
    return nullptr;
}

void RuntimeScope::clearSymbol(shared_ptr<Symbol> ptr) {
    if (symbolScope->find(ptr) != symbolScope->end()) {
        symbolScope->erase(ptr);
    }
}

void RuntimeScope::clearObject(shared_ptr<Object> ptr) {
    if (objectScope->find(ptr) != objectScope->end()) {
        objectScope->erase(ptr);
    }
}

void RuntimeScope::clearArray(shared_ptr<Array> ptr) {
    if (arrayScope->find(ptr) != arrayScope->end()) {
        arrayScope->erase(ptr);
    }
}

void RuntimeScope::clearValue(shared_ptr<Value> ptr) {
    if (valueScope->find(ptr) != valueScope->end()) {
        valueScope->erase(ptr);
    }
}

void RuntimeScope::clearFunction(shared_ptr<Function> ptr) {
    if (functionScope->find(ptr) != functionScope->end()) {
        functionScope->erase(ptr);
    }
}

}
