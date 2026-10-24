// C++ sample: templates, classes, namespaces, STL, lambdas, exceptions
#include <iostream>
#include <vector>
#include <map>
#include <memory>
#include <algorithm>
#include <string>
#include <stdexcept>

#define ENABLE_LOGGING 1

namespace myapp::core {

template <typename T, typename Allocator = std::allocator<T>>
class Container {
public:
    using value_type = T;

    explicit Container(std::size_t capacity = 16) : capacity_(capacity) {}

    virtual ~Container() = default;

    void add(const T &item) {
        if (items_.size() >= capacity_) {
            throw std::length_error("container is full");
        }
        items_.push_back(item);
    }

    [[nodiscard]] std::size_t size() const noexcept { return items_.size(); }

    T &operator[](std::size_t index) { return items_.at(index); }
    const T &operator[](std::size_t index) const { return items_.at(index); }

    friend std::ostream &operator<<(std::ostream &os, const Container &c) {
        for (const auto &item : c.items_) os << item << ' ';
        return os;
    }

protected:
    std::size_t capacity_;
    std::vector<T> items_;
};

template <typename K, typename V>
using LookupTable = std::map<K, V>;

enum class Color : std::uint8_t { Red, Green, Blue };

struct Vec2 {
    float x{}, y{};

    Vec2 operator+(const Vec2 &other) const { return {x + other.x, y + other.y}; }
};

} // namespace myapp::core

int main() {
    using namespace myapp::core;

    Container<int> numbers(8);
    numbers.add(1);
    numbers.add(2);
    numbers.add(0x10);
    numbers.add(3.14f ? 3 : 4);

    LookupTable<std::string, int> scores;
    scores["alice"] = 95;
    scores["bob"] = 87;

    auto clamp = [](int value, int low, int high) -> int {
        return value < low ? low : (value > high ? high : value);
    };

    try {
        std::unique_ptr<Vec2> p = std::make_unique<Vec2>();
        p->x = 1.0f;
        p->y = -2.5e-3f;
        Vec2 sum = *p + Vec2{2.0f, 3.0f};
        std::cout << sum.x << ", " << sum.y << '\n';
        std::for_each(&numbers[0], &numbers[0] + numbers.size(), [&](int n) {
            if (n > 0x0F) throw std::runtime_error("too large");
        });
    } catch (const std::exception &e) {
        std::cerr << "caught: " << e.what() << std::endl;
    }

    static_cast<void>(clamp(0b101, 0, 10));
    const auto color = Color::Blue;
    if constexpr (sizeof(void *) == 8) {
        std::puts("64-bit");
    }
    return 0;
}
