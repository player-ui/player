package com.intuit.playerui.core.error

import com.intuit.playerui.core.bridge.Invokable
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.hooks.NodeSyncBailHook1
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableFunction
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer

/** Severity levels for errors */
public enum class ErrorSeverity(
    public val value: String,
) {
    /** Cannot continue, flow must end */
    FATAL("fatal"),

    /** Standard error, may allow recovery */
    ERROR("error"),

    /** Non-blocking, logged for telemetry */
    WARNING("warning"),
}

/** Known error types for Player */
public object ErrorTypes {
    public const val EXPRESSION: String = "expression"
    public const val BINDING: String = "binding"
    public const val VIEW: String = "view"
    public const val ASSET: String = "asset"
    public const val NAVIGATION: String = "navigation"
    public const val VALIDATION: String = "validation"
    public const val DATA: String = "data"
    public const val SCHEMA: String = "schema"
    public const val NETWORK: String = "network"
    public const val PLUGIN: String = "plugin"
    public const val RENDER: String = "render"
}

/**
 * Represents a Player error with metadata
 */
@Serializable(with = PlayerErrorInfo.Serializer::class)
public class PlayerErrorInfo internal constructor(
    override val node: Node,
) : NodeWrapper {
    /** Nested error object containing message and name */
    private val error: Node? by NodeSerializableField(Node.serializer().nullable)

    /** The error message */
    public val message: String
        get() = error?.getString("message") ?: ""

    /** The error name */
    public val name: String
        get() = error?.getString("name") ?: ""

    /** Error category */
    public val errorType: String by NodeSerializableField(String.serializer()) { "" }

    /** Impact level */
    public val severity: ErrorSeverity?
        get() = node.getString("severity")?.let { ErrorSeverity.valueOf(it.uppercase()) }

    /** Additional metadata */
    public val metadata: Map<String, Any?>?
        get() = node.getObject("metadata") as? Map<String, Any?>

    internal object Serializer : NodeWrapperSerializer<PlayerErrorInfo>(::PlayerErrorInfo)
}

/**
 * Limited definition of the player error controller to enable error capture and management
 */
@Serializable(with = ErrorController.Serializer::class)
public class ErrorController internal constructor(
    override val node: Node,
) : NodeWrapper {
    private val captureError: Invokable<Node?>? by NodeSerializableFunction()
    private val getCurrentError: Invokable<Node?>? by NodeSerializableFunction()
    private val getErrors: Invokable<List<Node>?>? by NodeSerializableFunction()
    private val clearErrors: Invokable<Unit>? by NodeSerializableFunction()
    private val clearCurrentError: Invokable<Unit>? by NodeSerializableFunction()

    public val hooks: Hooks by NodeSerializableField(Hooks.serializer())

    /**
     * Capture an error with metadata
     * @param error The error/exception object
     * @param errorType Error category (use ErrorTypes constants)
     * @param severity Impact level
     * @param metadata Additional metadata map
     * @return The captured error as a Node
     */
    public fun captureError(
        error: Throwable,
        errorType: String,
        severity: ErrorSeverity? = null,
        metadata: Map<String, Any?>? = null,
    ): Node? {
        val errorObj = mapOf(
            "message" to error.message,
            "name" to error::class.simpleName,
        )

        return when {
            severity != null && metadata != null ->
                captureError?.invoke(errorObj, errorType, severity.value, metadata)
            severity != null ->
                captureError?.invoke(errorObj, errorType, severity.value)
            metadata != null ->
                captureError?.invoke(errorObj, errorType, null, metadata)
            else ->
                captureError?.invoke(errorObj, errorType)
        }
    }

    /**
     * Get the most recent error
     * @return The current error as a Node if one exists
     */
    public fun getCurrentError(): Node? = getCurrentError?.invoke()

    /**
     * Get the complete error history
     * @return List of all captured errors in chronological order
     */
    public fun getErrors(): List<Node>? = getErrors?.invoke()

    /**
     * Clear all errors (history + current + data model)
     */
    public fun clearErrors() {
        clearErrors?.invoke()
    }

    /**
     * Clear only current error and remove from data model, preserve history
     */
    public fun clearCurrentError() {
        clearCurrentError?.invoke()
    }

    @Serializable(Hooks.Serializer::class)
    public class Hooks internal constructor(
        override val node: Node,
    ) : NodeWrapper {
        /**
         * Fired when any error is captured
         * - The callback receives a PlayerErrorInfo object
         * - Return true from the callback to bail and prevent error state navigation
         * - Return false/null to continue to next handler
         */
        public val onError: NodeSyncBailHook1<PlayerErrorInfo, Boolean>
            by NodeSerializableField(NodeSyncBailHook1.serializer(PlayerErrorInfo.serializer(), Boolean.serializer()))

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    internal object Serializer : NodeWrapperSerializer<ErrorController>(::ErrorController)
}
