package com.intuit.playerui.utils.test

import com.intuit.playerui.core.bridge.runtime.serialize
import com.intuit.playerui.core.bridge.serialization.format.RuntimeFormat

public val equals: RuntimeFormat<*>.(first: Any?, second: Any?) -> Boolean = { first, second ->
    runtime.serialize(first) == this.runtime.serialize(second)
}
