package com.intuit.player.jvm.utils.test

import com.intuit.player.jvm.core.bridge.runtime.serialize
import com.intuit.player.jvm.core.bridge.serialization.format.RuntimeFormat

public val equals: RuntimeFormat<*>.(first: Any?, second: Any?) -> Boolean = { first, second ->
    runtime.serialize(first) == this.runtime.serialize(second)
}
