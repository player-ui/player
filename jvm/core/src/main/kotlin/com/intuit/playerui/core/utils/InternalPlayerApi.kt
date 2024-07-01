package com.intuit.playerui.core.utils

/**
 * Public API marked with this annotation is effectively **internal**, which means
 * it should not be used outside of `playerui.core`.
 * Signature, semantics, source and binary compatibilities are not guaranteed for this API
 * and will be changed without any warnings or migration aids.
 */
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION, AnnotationTarget.PROPERTY, AnnotationTarget.CONSTRUCTOR)
@RequiresOptIn(message = "This API is internal and is not intended for public usage.", level = RequiresOptIn.Level.WARNING)
public annotation class InternalPlayerApi
