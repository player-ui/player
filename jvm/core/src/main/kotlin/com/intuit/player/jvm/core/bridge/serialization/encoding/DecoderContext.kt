package com.intuit.player.jvm.core.bridge.serialization.encoding

import kotlin.coroutines.CoroutineContext
@JvmInline public value class DecoderContext(public val backingContext: CoroutineContext) : CoroutineContext by backingContext
