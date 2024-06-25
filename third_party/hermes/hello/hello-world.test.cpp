#include <gtest/gtest.h>
#include "hello-world.hpp"

TEST(HelloTest, DefaultExecuteReturnsStatusCode1) {
    EXPECT_EQ(1, execute());
}
