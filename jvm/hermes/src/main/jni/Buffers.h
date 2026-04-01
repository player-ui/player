#pragma once

#include <vector>
#include <cstring>
#include <jsi/jsi.h>

using namespace facebook::jsi;

namespace intuit::playerui {

class ByteArrayBuffer : public Buffer {
public:
    ByteArrayBuffer(const void* data, size_t size) : size_(size) {
        // Copy the data to ensure ownership, otherwise leads to segfault
        buffer_.resize(size);
        std::memcpy(buffer_.data(), data, size);
    }

    size_t size() const override { return size_; }
    const uint8_t* data() const override { return buffer_.data(); }

private:
    std::vector<uint8_t> buffer_;
    size_t size_;
};

};
