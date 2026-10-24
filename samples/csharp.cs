// C# sample: LINQ, async, properties, records, pattern matching
#nullable enable
#region Usings
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
#endregion

namespace MineralTheme.Samples;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class SampleAttribute : Attribute
{
    public string? Description { get; init; }
}

public record Point(double X, double Y)
{
    public double Magnitude => Math.Sqrt(X * X + Y * Y);
}

public interface IShape
{
    double Area { get; }
    event EventHandler? Changed;
}

public abstract class ShapeBase : IShape
{
    public abstract double Area { get; }
    public event EventHandler? Changed;

    protected virtual void OnChanged() => Changed?.Invoke(this, EventArgs.Empty);
}

[Sample(Description = "generics + constraints")]
public class Container<T> where T : notnull, IComparable<T>
{
    private readonly List<T> _items = new();
    private static readonly object Gate = new();
    internal const int MaxSize = 0x100;

    public int Count => _items.Count;
    public ref T this[int index] => ref _items[index];

    public void Add(T item)
    {
        lock (Gate)
        {
            if (_items.Count >= MaxSize) throw new InvalidOperationException("full");
            _items.Add(item);
        }
    }

    public IEnumerable<T> Sorted() => from item in _items orderby item select item;
}

public static class Program
{
    private static async Task Main(string[] args)
    {
        var points = new List<Point>
        {
            new(1.5, -2.5),
            new(3.25e2, 0xFF),
            new(0b1010, 1_000_000),
        };

        var near = from p in points
                   where p.Magnitude is > 0.5 and < 10.0
                   orderby p.Magnitude descending
                   select p.Magnitude;

        var lookup = points.ToDictionary(p => (int)p.X, p => p.Y);

        foreach (var (key, value) in lookup)
        {
            Console.WriteLine($"{key} -> {value:F2}");
        }

        string verdict = points[0] switch
        {
            { X: > 0, Y: < 0 } => "quadrant IV",
            { X: 0 } or { Y: 0 } => "axis",
            _ => "elsewhere",
        };

        int? maybe = null;
        double length = maybe?.ToString()?.Length ?? -1.0;

        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(0x10));
        await foreach (var n in GenerateAsync(cts.Token))
        {
            checked { length += n; }
        }

        unsafe
        {
            fixed (char* ptr = "pinned")
            {
                Console.WriteLine((long)ptr);
            }
        }
    }

    private static async IAsyncEnumerable<int> GenerateAsync([EnumeratorCancellation] CancellationToken ct)
    {
        for (var i = 0; i < 3; i++)
        {
            await Task.Delay(1, ct);
            yield return i;
        }
    }
}
