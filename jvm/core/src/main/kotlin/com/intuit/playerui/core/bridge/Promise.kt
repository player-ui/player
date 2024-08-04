package com.intuit.playerui.core.bridge

import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.add
import com.intuit.playerui.core.bridge.serialization.format.serializer
import com.intuit.playerui.core.bridge.serialization.json.isJsonElementSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.GenericSerializer
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.utils.InternalPlayerApi
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.util.*
import kotlin.coroutines.resumeWithException

/**
 * [Node] backed [Promise] implementation
 * Provides hooks into JS promise then and catch to maintain the JS promise API.
 */
// TODO: Potentially make Promise code in core internal
@InternalPlayerApi
@Serializable(with = Promise.Serializer::class)
public class Promise(override val node: Node) : NodeWrapper {

    /**
     * then -- handle JS promise resolved values
     *
     * @param deserializer used for decoding the argument into the [Expected] structure
     * @param block operation to perform on the resolved [Expected] value
     *
     * @return [Promise] chained after this then
     */
    public fun <Expected : Any, Next : Any> then(deserializer: DeserializationStrategy<Expected>, block: (Expected?) -> Next?): Promise =
        Promise(
            node.getInvokable<Node>("then")?.invoke(
                { arg: Any? ->
                    try {
                        block(
                            when (arg) {
                                // NOTE: JSI Value type structure would solve this - then I could make a single
                                //  JSI decoder/encoder and create wrappers for runtime concepts into the JSI concepts
                                //   CURRENT_V8(V8Value <- V8Decoder -> Node -> NodeWrapper)
                                //   CURRENT_HERMES(Value <- JSIDecoder -> Node -> NodeWrapper)
                                //   Abstract JSI definition such that we can translate non-JSI runtime JVM bindings into J(VM)JSI
                                //   TARGET(V8Value -> Value <- JSIDecoder -> JSIHybridClass) ValueWrapper probably could use a better name -- maybe could adopt FBJNI (JSI)HybridClass nomeclature too?
                                //   TARGET(JJSIValue -> Value <- JSIDecoder -> JSIHybridClass)
                                //  ^ The value here would be to consolidate our serialization layer since a lot of it
                                //    is already pretty similar. The decoders would access the runtime through the JJSI
                                //    runtime and value APIs.
                                // TODO: This part kinda sucks.. I feel like maybe we need a `NodePrimitive` or
                                //  some more sophisticated strategy for things that aren't object-like --
                                //  This would actually probably be fixed if we able to pass the [deserializer]
                                //  into the encoder so that it would be used when the format tries to decode
                                //  the value, since that _would_ be wrapped in a holder able to be generically
                                //  deserialized
                                is Node -> arg.deserialize(deserializer)
                                else -> if (deserializer.isJsonElementSerializer) {
                                    Json.encodeToJsonElement(
                                        GenericSerializer(),
                                        arg,
                                    )
                                } else {
                                    arg
                                }
                            } as? Expected,
                        )
                    } catch (e: Throwable) {
                        Promise.reject(e)
                    }
                },
            ) ?: throw PromiseException("then did not return valid Promise"),
        )

    /**
     * catch -- handle JS promise rejections
     *
     * @param block passes any thrown exception as a string containing the message.
     *  This is problematic b/c we lose the throwing context which makes it harder to debug.
     *
     * @return [Promise] chained after this catch
     */
    public fun <Next : Any> catch(block: (Throwable) -> Next?): Promise =
        Promise(
            node.getInvokable<Node>("catch")?.invoke(
                { arg: Any? ->
                    try {
                        // Attempt to dynamically build exception from JS error
                        if (arg is Exception) {
                            block(arg)
                        } else {
                            block((arg as Node).deserialize())
                        }
                    } catch (e: Exception) {
                        // fallback to simple String representation of error
                        // if you are debugging and the stacktrace leads you
                        // here, chances are, the rest of the stacktrace won't
                        // be very helpful
                        block(PromiseException(arg.toString()))
                    }
                },
            ) ?: throw PromiseException("then did not return valid Promise"),
        )

    /** Converts the [Promise] into a [Completable] to enable awaiting it to resolve or reject  */
    public fun <Expected : Any> toCompletable(deserializer: DeserializationStrategy<Expected>): Completable<Expected?> = object : Completable<Expected?> {
        override fun onComplete(block: (Result<Expected?>) -> Unit) {
            then(deserializer) {
                block(Result.success(it))
            }.catch {
                block(Result.failure(it))
            }
        }

        @ExperimentalCoroutinesApi
        override suspend fun asFlow(): Flow<Expected?> = callbackFlow {
            try {
                onComplete {
                    when {
                        it.isSuccess -> trySend(it.getOrNull())
                        it.isFailure -> close(it.exceptionOrNull())
                    }
                }
            } catch (e: Throwable) {
                close(e)
            } finally {
                close()
            }
            awaitClose { cancel() }
        }

        override suspend fun await(): Expected? = suspendCancellableCoroutine { cont ->
            try {
                onComplete(cont::resumeWith)
            } catch (e: Throwable) {
                cont.resumeWithException(e)
            }
        }
    }

    /** Static API defined for Promise in a [Runtime] */
    public interface Api {
        public fun <T : Any> resolve(vararg values: T): Promise
        public fun <T : Any> reject(vararg values: T): Promise
    }

    public object Serializer : KSerializer<Promise> by NodeWrapperSerializer(::Promise)
}

public inline fun <reified Expected : Any> Promise.then(noinline block: (Expected?) -> Any?): Promise =
    then(node.format.serializer(), block)

public inline fun <reified Expected : Any> Promise.toCompletable(): Completable<Expected?> =
    toCompletable(node.format.serializer())

public val NodeWrapper.Promise: Promise.Api get() = node.Promise

public val Node.Promise: Promise.Api get() = runtime.Promise

public val Runtime<*>.Promise: Promise.Api get() = getObject("Promise")?.let { promise ->
    object : Promise.Api {
        override fun <T : Any> resolve(vararg values: T): Promise = promise
            .getInvokable<Node>("resolve")?.invoke(*values)?.let(::Promise)
            ?: throw PromiseException("Could not resolve with values: $values")

        override fun <T : Any> reject(vararg values: T): Promise = promise
            .getInvokable<Node>("reject")?.invoke(*values)?.let(::Promise)
            ?: throw PromiseException("Could not reject with values: $values")
    }
} ?: throw PlayerRuntimeException("'Promise' not defined in runtime")

/** Helper to bridge complex [Promise] logic with the JS promise constructor */
public fun <T : Any> Runtime<*>.Promise(block: suspend ((T) -> Unit, (Throwable) -> Unit) -> Unit): Promise {
    val key = "promiseHandler_${UUID.randomUUID().toString().replace("-", "")}"
    add(key) { resolve: Invokable<Any?>, reject: Invokable<Any?> ->
        runtime.scope.launch {
            try {
                block({ runtime.scope.ensureActive(); resolve(it) }, { runtime.scope.ensureActive(); reject(it) })
            } catch (e: Throwable) {
                runtime.scope.ensureActive()
                reject(e)
            }
        }

        Unit
    }

    return Promise(
        execute("(new Promise($key))") as? Node
            ?: throw PromiseException("Error creating promise"),
    )
}
