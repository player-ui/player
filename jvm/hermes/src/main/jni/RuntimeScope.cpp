#include "RuntimeScope.h"
#include <stdexcept>

using namespace std;

namespace intuit::playerui {

void RuntimeScope::trackRef(void* ptr, VariantType value) {
    scope[ptr] = make_unique<variant<Value, Object, Array, Function>>(move(value));
}

VariantType& RuntimeScope::getRef(void* ptr) {
    return *scope[ptr];
}

void RuntimeScope::clearRef(void* ptr) {
    scope[ptr].reset();
}

}
