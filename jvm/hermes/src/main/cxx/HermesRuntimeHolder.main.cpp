#include <iostream>
#include <csignal>

#include "HermesRuntimeHolder.hpp"

using namespace intuit::playerui;

static const char *CODE = "(2 + 2)";

void segfaultHandler(int signal) {
    std::cerr << "FUCK: Segmentation fault" << std::endl;
    exit(signal); // Terminate the program
}

int main() {
    int status = 0;
    std::cout << "Running main" << std::endl;

    std::signal(SIGSEGV, segfaultHandler);

    try {
        auto runtime = HermesRuntimeHolder();
        runtime.execute(CODE);
        runtime.release();
        runtime.execute(CODE);
    } catch (facebook::jsi::JSError &e) {
        // Handle JS exceptions here.
        std::cout << "JS Exception: " << e.getStack() << std::endl;
        status = 1;
    } catch (facebook::jsi::JSIException &e) {
        // Handle JSI exceptions here.
        std::cout << "JSI Exception: " << e.what() << std::endl;
        status = 1;
    } catch (std::exception& e) {
        std::cerr << "Exception caught: " << e.what() << std::endl;
    }

    std::cout << "Done main: " << std::to_string(status) << std::endl;
    return status;
}

