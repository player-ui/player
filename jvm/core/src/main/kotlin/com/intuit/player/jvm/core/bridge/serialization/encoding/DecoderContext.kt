package com.intuit.player.jvm.core.bridge.serialization.encoding

import kotlin.coroutines.CoroutineContext
import kotlin.coroutines.EmptyCoroutineContext

//@JvmInline public value class DecoderContext(private val backingContext: CoroutineContext) : CoroutineContext by backingContext {
//    public interface Key<E : Element> : CoroutineContext.Key<E>
//    public interface Element : CoroutineContext.Element by DecoderContext(Element)
//}
public interface DecoderContext : CoroutineContext {

    public operator fun <E : Element> get(key: Key<E>): E?

//    /**
//     * Accumulates entries of this context starting with [initial] value and applying [operation]
//     * from left to right to current accumulator value and each element of this context.
//     */
//    public fun <R> fold(initial: R, operation: (R, Element) -> R): R

    /**
     * Returns a context containing elements from this context and elements from  other [context].
     * The elements from this context with the same key as in the other one are dropped.
     */
    // TODO: Loosen param constraints to accept any coroutine context & verify that this doesn't break EmptyCoroutineContext shortcuts
    public override operator fun plus(context: CoroutineContext): DecoderContext = DecoderContext(super.plus(context))

    /**
     * Returns a context containing elements from this context, but without an element with
     * the specified [key].
     */
    public fun minusKey(key: Key<*>): DecoderContext

    public interface Key<E : Element> : CoroutineContext.Key<E> {
        public companion object {
            // TODO: Unchecked casting sucks
            public operator fun <E : Element> invoke(backingKey: CoroutineContext.Key<*>): Key<E> = object : Key<E>, CoroutineContext.Key<E> by backingKey as CoroutineContext.Key<E> {}
        }
    }
    public interface Element : DecoderContext, CoroutineContext.Element {
        public override val key: Key<*>

        public override operator fun <E : Element> get(key: Key<E>): E? = super.get(key)

//        public override fun <R> fold(initial: R, operation: (R, Element) -> R): R = super.fold(initial) { r, element ->
//            operation(r, Element(element))
//        }

        public override fun minusKey(key: Key<*>): DecoderContext =
            // shortcut instead of delegating to wrapper
            if (this.key == key) EmptyDecoderContext else this


        // TODO: Should I relax the params? This'd ensure that you always get a DecoderContext back, instead of _just_ whenyou pass a valid DecoderContext.Element?
        public override fun plus(context: CoroutineContext): DecoderContext = DecoderContext(super<CoroutineContext.Element>.plus(context))

        public companion object {
            public operator fun invoke(backingElement: CoroutineContext.Element): Element =
                object : Element, DecoderContext by DecoderContext(backingElement) {
                    // TODO: This feels maybe way too lax?
                    override val key: Key<*> = Key<Element>(backingElement.key)

                    // TODO: Do I need these overrides?
//                    override fun <E : Element> get(key: Key<E>): E? = backingElement[key]
//                    override fun <R> fold(initial: R, operation: (R, Element) -> R): R = backingElement.fold(initial) { r, element ->
//                        operation(r, Element(element))
//                    }
//                    override fun plus(context: DecoderContext): DecoderContext = DecoderContext(backingElement.plus(context))
//                    override fun minusKey(key: Key<*>): DecoderContext = DecoderContext(backingElement.minusKey(key))
                }
        }
    }

    public companion object {
        public operator fun invoke(backingContext: CoroutineContext): DecoderContext =
            object : DecoderContext, CoroutineContext by backingContext {
                override fun <E : Element> get(key: Key<E>): E? = backingContext[key]
//                override fun <R> fold(initial: R, operation: (R, Element) -> R): R = backingContext.fold(initial) { r, element ->
//                    operation(r, Element(element))
//                }
                override fun plus(context: CoroutineContext): DecoderContext = DecoderContext(backingContext.plus(context))
                override fun minusKey(key: Key<*>): DecoderContext = DecoderContext(backingContext.minusKey(key))
            }
    }
}

public object EmptyDecoderContext : DecoderContext by DecoderContext(EmptyCoroutineContext)
