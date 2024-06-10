#include <hermes/hermes.h>
#include <gtest/gtest.h>
#include "HermesRuntimeHolder.hpp"

using namespace intuit::playerui;

TEST(HermesRuntimeHolderTest, ExecuteArbitraryJS) {
    auto holder = HermesRuntimeHolder();
    facebook::jsi::Value result = holder.execute("2 + 3");
    ASSERT_TRUE(result.isNumber());
    EXPECT_EQ(5, result.asNumber());
}

TEST(HermesRuntimeHolderTest, ReleasingThrows) {
    auto holder = HermesRuntimeHolder();
    holder.release();
    try {
        auto result = holder.execute("2 + 3");
    } catch (HermesRuntimeException& e) {
        EXPECT_STREQ("Runtime released!", e.what());
    }
}
