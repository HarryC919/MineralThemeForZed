package com.example.samples;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Doc comment: class level JavaDoc with {@code generics} and @author tags.
 * @author sample
 * @version 1.0
 */
@Deprecated(since = "1.2")
public sealed interface Shape permits Circle, Rectangle {
    double area();

    default String describe() {
        return "shape with area " + area();
    }
}

record Circle(double radius) implements Shape {
    static final double PI = 3.14159_26535_89793;

    @Override
    public double area() {
        return PI * radius * radius;
    }
}

final class Rectangle implements Shape {
    private final double width, height;
    protected transient int cache;

    Rectangle(double width, double height) {
        assert width >= 0 : "negative width";
        this.width = width;
        this.height = height;
    }

    @Override
    public double area() {
        return width * height;
    }
}

enum Status {
    ACTIVE("A"), INACTIVE("I"), PENDING("P");

    private final String code;

    Status(String code) {
        this.code = code;
    }

    String code() {
        return code;
    }
}

public class Main {
    private static final String GREETING = "Hello, %s!";
    public volatile int counter = 0;

    public static void main(String[] args) throws InterruptedException {
        var shapes = List.<Shape>of(new Circle(2.5), new Rectangle(3.0, 4.0));
        double total = shapes.stream().mapToDouble(Shape::area).sum();

        Map<String, Integer> lengths = shapes.stream()
                .collect(Collectors.toMap(Object::toString, s -> s.describe().length()));

        String name = "World";
        String textBlock = """
                line one
                line "two" with \t escape
                """;

        int choice = 2;
        String label = switch (choice) {
            case 1 -> "one";
            case 2, 3 -> "two or three";
            case 0x10 -> "hex";
            default -> {
                yield "other: " + choice;
            }
        };

        try (var scanner = new java.util.Scanner(System.in)) {
            for (int i = 0; i < 10; i++) {
                counter += i;
                if (counter % 2 == 0) continue;
                else if (counter > 100) break;
            }
        } catch (IllegalStateException | IllegalArgumentException e) {
            System.err.println("caught " + e.getMessage());
            throw new RuntimeException(e);
        } finally {
            System.out.printf(GREETING + " total=%.2f%n", name, total);
        }

        Optional.ofNullable(args.length > 0 ? args[0] : null)
                .ifPresentOrElse(System.out::println, () -> System.out.println("none"));

        Runnable task = () -> {
            synchronized (Main.class) {
                counter++;
            }
        };
        new Thread(task).start();
        Thread.sleep(0x10L);
    }
}
