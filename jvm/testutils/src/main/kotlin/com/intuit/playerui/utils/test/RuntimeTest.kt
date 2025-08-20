package com.intuit.playerui.utils.test

import com.intuit.playerui.core.bridge.runtime.PlayerRuntimeContainer
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.runtimeContainers
import com.intuit.playerui.core.bridge.runtime.runtimeFactory
import com.intuit.playerui.core.bridge.serialization.format.RuntimeFormat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestTemplate
import org.junit.jupiter.api.extension.BeforeEachCallback
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.api.extension.Extension
import org.junit.jupiter.api.extension.ExtensionContext
import org.junit.jupiter.api.extension.TestTemplateInvocationContext
import org.junit.jupiter.api.extension.TestTemplateInvocationContextProvider

/**
 * Simple base test class for testing each [Runtime] implementation on the classpath. Tests should be
 * annotated with [TestTemplate] if it should be tested on each runtime. Otherwise, tests annotated
 * with the typical [Test], it will only execute once with the default [factory] runtime.
 */
@ExtendWith(RuntimeContextProvider::class)
public abstract class RuntimeTest {
    public var runtime: Runtime<*> = runtimeFactory.create()

    public val format: RuntimeFormat<Any?> get() = runtime.format as RuntimeFormat<Any?>
}

private class RuntimeContextProvider : TestTemplateInvocationContextProvider {
    override fun supportsTestTemplate(context: ExtensionContext) = true

    override fun provideTestTemplateInvocationContexts(context: ExtensionContext) = runtimeContainers
        .map { RuntimeContext(context, it) as TestTemplateInvocationContext }
        .stream()
}

private class RuntimeContext(
    val context: ExtensionContext,
    val runtimeContainer: PlayerRuntimeContainer,
) : TestTemplateInvocationContext {
    override fun getDisplayName(invocationIndex: Int): String = "[$runtimeContainer] ${context.requiredTestMethod.name}"

    override fun getAdditionalExtensions(): MutableList<Extension> = mutableListOf(RuntimeSetterExtension(runtimeContainer))
}

private class RuntimeSetterExtension(
    val runtimeContainer: PlayerRuntimeContainer,
) : BeforeEachCallback {
    override fun beforeEach(context: ExtensionContext) {
        val runtimeTestInstance = context.requiredTestInstance as RuntimeTest
        // TODO: Maybe provide a way configure runtime?
        runtimeTestInstance.runtime = runtimeContainer.factory.create()
    }
}
