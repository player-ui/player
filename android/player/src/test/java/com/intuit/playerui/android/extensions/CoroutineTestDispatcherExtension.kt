package com.intuit.playerui.android.extensions

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.extension.AfterEachCallback
import org.junit.jupiter.api.extension.BeforeEachCallback
import org.junit.jupiter.api.extension.ExtensionContext

@OptIn(ExperimentalCoroutinesApi::class)
public class CoroutineTestDispatcherExtension : AfterEachCallback, BeforeEachCallback {

    private val dispatcher = UnconfinedTestDispatcher()

    override fun beforeEach(context: ExtensionContext?): Unit = Dispatchers.setMain(dispatcher)

    override fun afterEach(context: ExtensionContext?): Unit = Dispatchers.resetMain()
}
