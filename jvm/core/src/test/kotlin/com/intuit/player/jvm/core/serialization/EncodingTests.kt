package com.intuit.player.jvm.core.serialization

import com.intuit.player.jvm.core.bridge.serialization.format.encodeToRuntimeValue
import com.intuit.player.jvm.core.bridge.serialization.format.runtimeArray
import com.intuit.player.jvm.core.bridge.serialization.format.runtimeObject
import com.intuit.player.jvm.utils.test.RuntimeTest
import com.intuit.player.jvm.utils.test.equals
import kotlinx.serialization.Serializable
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate

internal class StructureEncoding : RuntimeTest() {

    @TestTemplate
    fun `encode concretely typed flat map`() {
        val runtimeObject = format.runtimeObject {
            this["one"] = 1
            this["two"] = 2
            this["three"] = 3
        }

        val map = mapOf(
            "one" to 1,
            "two" to 2,
            "three" to 3,
        )

        assertTrue(format.equals(runtimeObject, format.encodeToRuntimeValue(map)))
    }

    @TestTemplate
    fun `encode abstractly typed flat map`() {
        val runtimeObject = format.runtimeObject {
            this["one"] = 1
            this["true"] = true
            this["three"] = "three"
        }

        val map = mapOf(
            "one" to 1,
            "true" to true,
            "three" to "three",
        )

        assertTrue(format.equals(runtimeObject, format.encodeToRuntimeValue(map)))
    }

    @TestTemplate
    fun `encode concretely typed nested map`() {
        val runtimeObject = format.runtimeObject {
            this["one"] = format.runtimeObject {
                this["two"] = 2
            }
            this["three"] = format.runtimeObject {
                this["four"] = 4
            }
        }

        val map = mapOf(
            "one" to mapOf(
                "two" to 2,
            ),
            "three" to mapOf(
                "four" to 4,
            ),
        )

        assertTrue(format.equals(runtimeObject, format.encodeToRuntimeValue(map)))
    }

    @TestTemplate
    fun `encode abstractly typed nested map`() {
        val runtimeObject = format.runtimeObject {
            this["one"] = format.runtimeObject {
                this["two"] = 2
                this["three"] = true
            }
            this["four"] = format.runtimeObject {
                this["five"] = 5
                this["six"] = "six"
            }
            this["seven"] = 7.7
        }

        val map = mapOf(
            "one" to mapOf(
                "two" to 2,
                "three" to true,
            ),
            "four" to mapOf(
                "five" to 5,
                "six" to "six",
            ),
            "seven" to 7.7,
        )

        assertTrue(format.equals(runtimeObject, format.encodeToRuntimeValue(map)))
    }

    @TestTemplate
    fun `encode concretely typed flat list`() {
        val runtimeArray = format.runtimeArray {
            append(1)
            append(2)
            append(3)
        }

        val list = listOf(
            1,
            2,
            3,
        )

        assertTrue(format.equals(runtimeArray, format.encodeToRuntimeValue(list)))
    }

    @TestTemplate
    fun `encode abstractly typed flat list`() {
        val runtimeArray = format.runtimeArray {
            append(1)
            append("two")
            append(true)
        }

        val list = listOf(
            1,
            "two",
            true,
        )

        assertTrue(format.equals(runtimeArray, format.encodeToRuntimeValue(list)))
    }

    @TestTemplate
    fun `encode concretely typed nested list`() {
        val runtimeArray = format.runtimeArray {
            append(
                format.runtimeArray {
                    append(1)
                    append(2)
                },
            )
            append(
                format.runtimeArray {
                    append(3)
                    append(4)
                },
            )
        }

        val list = listOf(
            listOf(1, 2),
            listOf(3, 4),
        )

        assertTrue(format.equals(runtimeArray, format.encodeToRuntimeValue(list)))
    }

    @TestTemplate
    fun `encode abstractly typed nested list`() {
        val runtimeArray = format.runtimeArray {
            append(
                format.runtimeArray {
                    append(1)
                    append("two")
                },
            )
            append(
                format.runtimeArray {
                    append(3)
                    append(false)
                },
            )
            append(7.7)
        }

        val list = listOf(
            listOf(1, "two"),
            listOf(3, false),
            7.7,
        )

        assertTrue(format.equals(runtimeArray, format.encodeToRuntimeValue(list)))
    }
}

internal class ClassEncoding : RuntimeTest() {

    @Serializable
    data class PrimitiveData(
        val int: Int = 0,
        val string: String = "string",
        val double: Double = 7.7,
        val boolean: Boolean = true,
        val nullable: Boolean? = null,
    )

    @TestTemplate
    fun `encode serializable class with primitives`() {
        val runtimeObject = format.runtimeObject {
            this["int"] = 0
            this["string"] = "string"
            this["double"] = 7.7
            this["boolean"] = true
            this["nullable"] = null
        }

        assertTrue(format.equals(runtimeObject, format.encodeToRuntimeValue(PrimitiveData())))
    }
}
