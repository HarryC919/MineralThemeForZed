// Kotlin sample: data classes, sealed, when, coroutines, extensions
package com.example.samples

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext
import java.util.concurrent.atomic.AtomicLong

const val DEFAULT_SCALE: Double = 2.718281828
const val HEX_MASK: Int = 0xFF or (0xF shl 4)

sealed interface Shape {
    val area: Double
}

data class Circle(val radius: Double) : Shape {
    override val area: Double
        get() = Math.PI * radius * radius
}

data class Rect(val width: Double, val height: Double) : Shape {
    override val area get() = width * height
}

object UnitShape : Shape {
    override val area: Double = 0.0
}

data class Label(val text: String, val bold: Boolean = false) {
    operator fun plus(other: Label): Label = Label("$text ${other.text}", bold || other.bold)
}

fun Shape.describe(): String = when (this) {
    is Circle -> if (radius > 10) "big circle" else "circle ${"%.2f".format(area)}"
    is Rect -> "rect ${width}x$height"
    UnitShape -> "unit"
    null -> "null shape" // exhaustive with nullable receiver
}

suspend fun measureShapes(shapes: List<Shape>): Flow<Double> = flow {
    for (shape in shapes) {
        withContext(Dispatchers.Default) {
            emit(shape.area)
        }
    }
}

class Counter<T : Any> {
    private val value = AtomicLong(0)
    var scale: Double by ::DEFAULT_SCALE.let { mutableStateOf(it) }

    fun tick(): Long = value.incrementAndGet()

    companion object {
        private val counter = Counter<String>()
        @JvmStatic
        fun main(args: Array<String>) {
            val labels = listOf(Label("alpha"), Label("beta", bold = true))
            val combined = labels.reduce { acc, next -> acc + next }

            val shapes = mapOf(
                "circle" to Circle(2.5e0),
                "rect" to Rect(3.0, 4.0),
                "unit" to UnitShape,
            )

            val annotated: List<Pair<String, Double>> = shapes.mapNotNull { (name, shape) ->
                if (shape.area > 0.0) name to shape.area else null
            }

            runBlocking {
                measureShapes(shapes.values.toList()).collect { area ->
                    println("%s -> %.3f".format("shape", area))
                }
            }

            val masked = HEX_MASK and 0x55 or 0x0F.inv()
            println("$combined masked=$masked count=${counter.tick()} label=${labels[1].text}")
        }
    }
}

private fun mutableStateOf(default: Double): Double = default
