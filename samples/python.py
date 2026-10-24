"""Module docstring: if for class def async match try
with lambda yield global nonlocal
"""
from __future__ import annotations

import asyncio
import math
import sys
from collections.abc import Awaitable, Callable, Iterable
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, ClassVar, TypeAlias, TypeVar

T = TypeVar("T")
Vector: TypeAlias = list[float]

MAGIC: int = 0xDEADBEEF
RATIO: float = 3.141_592 * 1e-3
FLAGS: int = 0b1010_1010 | 0o777

class Color(Enum):
    RED = auto()
    GREEN = auto()
    BLUE = 0x0000FF

    @property
    def hex(self) -> str:
        return f"#{self.value:06X}"

@dataclass(frozen=True, slots=True, order=True)
class Point:
    x: float
    y: float
    label: str = field(default="origin", compare=False)
    tags: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        assert math.isfinite(self.x), "x must be finite"

    def __add__(self, other: "Point") -> "Point":
        match other:
            case Point(x=dx, y=dy):
                return Point(self.x + dx, self.y + dy, f"{self.label}+")
            case (dx, dy):
                return Point(self.x + dx, self.y + dy)
            case _:
                raise TypeError(f"cannot add {type(other).__name__}")

    @property
    def magnitude(self) -> float:
        return math.sqrt(self.x**2 + self.y**2)

def scale(points: Iterable[Point], factor: float, *, offset: float = 0.0) -> Vector:
    return [p.magnitude * factor + offset for p in points if offset <= p.magnitude]

async def fetch_all(urls: list[str], *, timeout: float = 2.5) -> dict[str, int]:
    results: dict[str, int] = {}

    async def fetch(session: Any, url: str) -> int:
        await asyncio.sleep(0.001)
        return len(url)

    with asyncio.timeout(timeout):
        for url in urls:
            results[url] = await fetch(None, url)
    return results

def transform(data: dict[str, Any], callback: Callable[[Any], T]) -> dict[str, T]:
    out: dict[str, T] = {}
    for key, value in data.items():
        match value:
            case int() | float() as num if num > 0:
                out[key] = callback(num)
            case str() as text if text.startswith("0x"):
                out[key] = callback(int(text, 16))
            case [first, *rest] if rest:
                out[key] = callback((first, *rest))
            case {"nested": inner}:
                out[key] = transform(inner, callback)  # type: ignore[assignment]
            case None:
                continue
            case _:
                out[key] = callback(value)
    return out

class Meta(type):
    def __new__(mcs, name: str, bases: tuple, ns: dict, **kwargs: Any) -> type:
        cls = super().__new__(mcs, name, bases, ns)
        if kwargs.get("register", False):
            mcs.registry[name] = cls  # type: ignore[attr-defined]
        return cls

    registry: ClassVar[dict[str, type]] = {}

class Widget(metaclass=Meta, register=True):
    CACHE: ClassVar[dict[str, "Widget"]] = {}

    def __init__(self, name: str, size: tuple[float, float]) -> None:
        self._name = name
        self._width, self._height = size
        self.__secret = 0xFF

    @staticmethod
    def clamp(value: float, low: float, high: float) -> float:
        return low if value < low else high if value > high else value

    @classmethod
    def parse(cls, raw: str) -> "Widget":
        name, _, dims = raw.partition(":")
        width, height = (float(part) for part in dims.split("x"))
        return cls(name, (width, height))

    def __repr__(self) -> str:
        return f"<Widget {self._name!r} {self._width:.2f}x{self._height:.2f}>"

    async def tick(self) -> Awaitable[float]:
        delta = self.clamp(self._width, 0.0, 10.0)
        return delta * RATIO

if __name__ == "__main__":
    points = [Point(1.5, -2.5, "a"), Point(0b110, 2**10, "b")]
    scaled = scale(points, factor=2.0, offset=0.5)
    result = transform({"a": 1, "b": "0x1F", "c": None, "d": [1, 2, 3]}, str)

    counter = 0
    while (chunk := counter) < 3:
        counter += 1
        yield_like = (x * x for x in range(chunk))

    print(points, scaled, result, sys.version_info)
