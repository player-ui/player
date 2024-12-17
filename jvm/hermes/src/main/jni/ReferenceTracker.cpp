#include "ReferenceTracker.h"
#include <stdexcept>

using namespace std;

namespace intuit::playerui {

void ReferenceTracker::trackRef(void* ptr, VariantType value) {
    refMap[ptr] = make_unique<variant<Value, Object, Array, Function>>(move(value));
}

VariantType& ReferenceTracker::getRef(void* ptr) {
    return *refMap[ptr];
}

void ReferenceTracker::clearRef(void* ptr) {
    refMap[ptr].reset();
}

}
