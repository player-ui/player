package com.intuit.playerui.core.plugins

import com.intuit.playerui.core.bridge.runtime.Runtime

/** [Plugin] that enables additional configuration of a [Runtime] */
public interface RuntimePlugin : Plugin {
    // TODO: Should be suspend?

    /** Invoked with the [Runtime] instance to configure */
    public fun apply(runtime: Runtime<*>)
}
