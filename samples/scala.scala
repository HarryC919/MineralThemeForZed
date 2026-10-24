// Scala sample: case classes, pattern matching, given/using, for-comprehension
package com.example.samples

import scala.collection.immutable.{ListMap, TreeSet}
import scala.concurrent.Future
import scala.util.{Failure, Success, Try}

trait Codec[A]:
  def encode(value: A): String
  def decode(text: String): Either[String, A]

object codecs:
  given intCodec: Codec[Int] with
    def encode(value: Int): String = value.toHexString
    def decode(text: String): Either[String, Int] =
      Try(Integer.parseInt(text, 16)) match
        case Success(v) => Right(v)
        case Failure(_) => Left(s"invalid hex: $text")

  given listCodec[A](using inner: Codec[A]): Codec[List[A]] with
    def encode(values: List[A]): String = values.map(inner.encode).mkString(",")
    def decode(text: String): Either[String, List[A]] =
      text.split(',').toList.traverse(inner.decode)

case class Point(x: Double, y: Double):
  def +(other: Point): Point = Point(x + other.x, y + other.y)
  lazy val magnitude: Double = math.sqrt(x * x + y * y)

sealed trait Shape:
  def area: Double

case class Circle(radius: Double) extends Shape:
  override def area: Double = math.Pi * radius * radius

case object UnitShape extends Shape:
  override def area: Double = 0.0

enum Color(val hex: Int):
  case Red extends Color(0xFF0000)
  case Green extends Color(0x00FF00)
  case Blue extends Color(0x0000FF)

object Main:
  private val Scale = 2.5e-3
  private var counter: Long = 0xFFL

  def describe(shape: Shape): String = shape match
    case Circle(r) if r > 10 => s"big circle r=$r%.2f"
    case Circle(r)           => s"circle area=${math.Pi * r * r}%.3f"
    case UnitShape           => "unit"

  def main(args: Array[String]): Unit =
    val points = List(Point(1.5, -2.5), Point(0xA0, 0b101), Point(3, 4))
    val moved = for
      p <- points
      dx <- Some(1.0)
      if p.magnitude > 1.0
    yield p + Point(dx, dx)

    val total = moved.foldLeft(0.0)((acc, p) => acc + p.magnitude)
    val colors: TreeSet[Color] = TreeSet(Color.Red, Color.Blue)

    given Codec[Int] = codecs.intCodec
    val encoded = List(0x1F, 0b11, 0).encode

    counter += 1
    val future: Future[String] = Future.successful(f"total=$total%.2f")
    future.onComplete {
      case Success(msg) => println(s"$msg encoded=$encoded scale=$Scale%.4f")
      case Failure(err) => println(s"failed: ${err.getMessage}")
    }

    val lookup = ListMap("a" -> 1, "b" -> 0x2)
    lookup.foreach { (k, v) => println(s"$k -> $v hex=${v.toHexString}") }
