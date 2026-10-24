//! Zig sample: comptime, error sets, builtins, generics
const std = @import("std");
const builtin = @import("builtin");
const Allocator = std.mem.Allocator;

pub const VERSION: u32 = 0x0104;
pub const NAME: []const u8 = "zig-sample";
pub const PI: f64 = 3.14159265358979;
pub const MASK: u8 = 0b1100_1010;

pub const ParseError = error{
    OutOfMemory,
    InvalidCharacter,
    Overflow,
};

const Point = struct {
    x: i32 = 0,
    y: i32 = 0,
    label: []const u8 = "origin",

    const Self = @This();

    pub fn init(x: i32, y: i32) Self {
        return .{ .x = x, .y = y, .label = "point" };
    }

    pub fn distance(self: Self, other: Self) f64 {
        const dx: f64 = @floatFromInt(self.x - other.x);
        const dy: f64 = @floatFromInt(self.y - other.y);
        return @sqrt(dx * dx + dy * dy);
    }
};

const Shape = union(enum) {
    circle: struct { radius: f64 },
    rect: struct { w: f64, h: f64 },
    empty: void,

    pub fn area(self: Shape) f64 {
        return switch (self) {
            .circle => |c| PI * c.radius * c.radius,
            .rect => |r| r.w * r.h,
            .empty => 0,
        };
    }
};

fn ComptimeList(comptime T: type, comptime capacity: usize) type {
    return struct {
        items: [capacity]T,
        count: usize = 0,

        pub fn push(self: *Self(T, capacity), item: T) ParseError!void {
            if (self.count == capacity) return error.OutOfMemory;
            self.items[self.count] = item;
            self.count += 1;
        }
    };
}

pub fn parsePositive(input: []const u8) ParseError!u32 {
    if (input.len == 0) return error.InvalidCharacter;
    var value: u32 = 0;
    for (input) |ch| {
        const digit: u32 = switch (ch) {
            '0'...'9' => ch - '0',
            else => return error.InvalidCharacter,
        };
        value = try std.math.mul(u32, value, 10);
        value = try std.math.add(u32, value, digit);
    }
    return value;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const p1 = Point.init(3, 4);
    var p2 = Point{ .x = -1, .y = 2 };
    p2.label = "custom";

    var shapes = [_]Shape{
        .{ .circle = .{ .radius = 2.5 } },
        .{ .rect = .{ .w = 3.0, .h = 4.0 } },
        .empty,
    };

    for (shapes, 0..) |shape, i| {
        std.debug.print("shape[{d}] area = {d:.2}\n", .{ i, shape.area() });
    }

    var list = ComptimeList(u8, 16){ .items = undefined };
    try list.push(MASK);
    try list.push(0o17);

    const n = try parsePositive("12345");
    std.debug.print("{s} v{X} n={d} dist={e}\n", .{ NAME, VERSION, n, p1.distance(p2) });

    if (builtin.os.tag == .macos) {
        @setRuntimeSafety(false);
    }
    inline for (.{ u8, u16, u32 }) |T| {
        @compileLog(@typeName(T));
    }
}
