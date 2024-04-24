package com.intuit.playerui.core.serialization

import com.intuit.playerui.core.bridge.serialization.format.decodeFromRuntimeValue
import com.intuit.playerui.core.bridge.serialization.format.runtimeArray
import com.intuit.playerui.core.bridge.serialization.format.runtimeObject
import com.intuit.playerui.core.experimental.RuntimeClassDiscriminator
import com.intuit.playerui.utils.test.RuntimeTest
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.TestTemplate

@Serializable
@RuntimeClassDiscriminator("discriminator")
sealed class Sealed {
    abstract val str: String

    @Serializable
    @SerialName("intChild")
    data class IntChild(val int: Int, override val str: String) : Sealed()

    @Serializable
    @SerialName("boolChild")
    data class BoolChild(val bool: Boolean, override val str: String) : Sealed()
}

internal class StructureDecoding : RuntimeTest() {

    @TestTemplate
    fun `decode concretely typed flat map`() {
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

        val data = format.decodeFromRuntimeValue(MapSerializer(String.serializer(), Int.serializer()), runtimeObject)
        assertEquals(map, data)
    }

    @TestTemplate
    fun `decode abstractly typed flat map`() {
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

        assertEquals(map, format.decodeFromRuntimeValue(runtimeObject))
    }

    @TestTemplate
    fun `decode concretely typed nested map`() {
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

        val data = format.decodeFromRuntimeValue(MapSerializer(String.serializer(), MapSerializer(String.serializer(), Int.serializer())), runtimeObject)
        assertEquals(map, data)
    }

    @TestTemplate
    fun `decode abstractly typed nested map`() {
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

        assertEquals(map, format.decodeFromRuntimeValue(runtimeObject))
    }

    @TestTemplate
    fun `decode concretely typed flat list`() {
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

        val data = format.decodeFromRuntimeValue(ListSerializer(Int.serializer()), runtimeArray)
        assertEquals(list, data)
    }

    @TestTemplate
    fun `decode abstractly typed flat list`() {
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

        assertEquals(list, format.decodeFromRuntimeValue(runtimeArray))
    }

    @TestTemplate
    fun `decode concretely typed nested list`() {
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

        val data = format.decodeFromRuntimeValue(ListSerializer(ListSerializer(Int.serializer())), runtimeArray)
        assertEquals(list, data)
    }

    @TestTemplate
    fun `decode abstractly typed nested list`() {
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

        assertEquals(list, format.decodeFromRuntimeValue(runtimeArray))
    }
}

class DecodingTests : RuntimeTest() {

    @TestTemplate
    fun `decode sealed class`() {
        val intDataObj = runtime.format.runtimeObject {
            this["discriminator"] = "intChild"
            this["str"] = "string"
            this["int"] = 1
        }

        val boolDataObj = format.runtimeObject {
            this["discriminator"] = "boolChild"
            this["str"] = "string"
            this["bool"] = true
        }

        val intData = format.decodeFromRuntimeValue(Sealed.serializer(), intDataObj)
        assertTrue(intData is Sealed.IntChild)
        assertEquals("string", intData.str)
        assertEquals(1, (intData as Sealed.IntChild).int)

        val boolData = format.decodeFromRuntimeValue(Sealed.serializer(), boolDataObj)
        assertTrue(boolData is Sealed.BoolChild)
        assertEquals("string", boolData.str)
        assertTrue((boolData as Sealed.BoolChild).bool)
    }
}

internal class ClassDecoding : RuntimeTest() {

    @Serializable
    data class PrimitiveData(
        val int: Int = 0,
        val string: String = "string",
        val double: Double = 7.7,
        val boolean: Boolean = true,
        val nullable: Boolean? = null,
    )

    @TestTemplate
    fun `decode serializable class`() {
        val obj = format.runtimeObject {
            this["int"] = 0
            this["string"] = "string"
            this["double"] = 7.7
            this["boolean"] = true
            this["nullable"] = null
        }

        val data: PrimitiveData = format.decodeFromRuntimeValue(obj)
        assertEquals(PrimitiveData(), data)
    }
}
