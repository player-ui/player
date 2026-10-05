"""Shared Kotlin compiler options, so per-target option sets can't drift from the defaults"""

OPTINS = [
    "kotlin.RequiresOptIn",
    "com.intuit.playerui.core.utils.InternalPlayerApi",
    "com.intuit.playerui.core.experimental.ExperimentalPlayerApi",
    "kotlinx.serialization.ExperimentalSerializationApi",
    "kotlinx.coroutines.ExperimentalCoroutinesApi",
    "kotlin.contracts.ExperimentalContracts",
]
