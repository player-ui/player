#pragma once

#include <iostream>
#include <jsi/jsi.h>

using namespace facebook::jsi;

namespace intuit::playerui {

    // just a value dumper
    void coutValueInfo(Value& value, Runtime& runtime) {
        std::cout << std::boolalpha;

        std::cout << "Runtime: " << &runtime << std::endl;
        std::cout << "Pointer: " << &value << std::endl;
        std::cout << "Kind: ";

        if (value.isNull()) {
            std::cout << "isNull";
        }
        if (value.isBool()) {
            std::cout << "isBool";
        }
        if (value.isNumber()) {
            std::cout << "isNumber";
        }
        if (value.isString()) {
            std::cout << "isString";
        }
        if (value.isBigInt()) {
            std::cout << "isBigInt";
        }
        if (value.isSymbol()) {
            std::cout << "isSymbol";
        }
        if (value.isObject()) {
            std::cout << "isObject";
        }

        std::cout << std::endl;
        std::cout << "Value: " << value.toString(runtime).utf8(runtime) << std::endl;
    }

}
