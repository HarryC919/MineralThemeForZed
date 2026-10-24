// Swift sample: protocols, extensions, closures, optionals, generics
import Foundation

let version: Double = 1.0
let mask: UInt8 = 0xFF
let ratio = 1.618_033_988
let name = "My Dark Theme"

enum Color: String, CaseIterable {
    case teal, blue = "0x5393FF", pink

    var hex: String {
        switch self {
        case .teal: return "#80CBC4"
        case .blue: return rawValue
        case .pink: return "#FF669E"
        }
    }
}

protocol Shape {
    associatedtype Unit: Numeric
    var area: Double { get }
    func describe(using formatter: (Double) -> String) -> String
}

struct Circle: Shape {
    typealias Unit = Double
    let radius: Double
    private(set) var tag: String?

    var area: Double { Double.pi * radius * radius }

    func describe(using formatter: (Double) -> String) -> String {
        "circle \(formatter(area))"
    }
}

final class Registry<T: Shape> {
    private var items: [T] = []
    private let lock = NSLock()
    var isEmpty: Bool { items.isEmpty }
    subscript(index: Int) -> T {
        get { items[index] }
        set { items[index] = newValue }
    }

    func add(_ item: T) {
        lock.lock(); defer { lock.unlock() }
        items.append(item)
    }

    func map<U>(_ transform: (T) throws -> U) rethrows -> [U] {
        try items.map(transform)
    }
}

extension Circle: CustomStringConvertible {
    var description: String {
        "Circle(radius: \(radius), area: \(String(format: "%.2f", area)))"
    }
}

func renderAll(shapes: [any Shape]) -> String {
    var output = ""
    for shape in shapes {
        output += shape.describe { String(format: "%.3f", $0) } + "\n"
    }
    guard !output.isEmpty else { return "empty" }
    return output
}

@main
struct Main {
    static func main() async throws {
        let registry = Registry<Circle>()
        registry.add(Circle(radius: 2.5, tag: "primary"))
        registry.add(Circle(radius: 0xFF / 100.0))

        let circles: [Circle] = await Task.detached {
            try? await Task.sleep(nanoseconds: 1_000_000)
            return registry.map { $0 }
        }.value

        let label: String? = circles.first?.tag
        if let label, !label.isEmpty {
            print("label: \(label)")
        } else if case .none = label {
            print("unlabeled")
        }

        repeat {
            print(renderAll(shapes: circles))
            break
        } while false

        let interpolated = "\(name) v\(version) mask=\(mask) ratio=\(ratio)"
        print(interpolated)
    }
}
