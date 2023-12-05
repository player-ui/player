package com.intuit.player.jvm.utils.test

import com.intuit.player.jvm.core.flow.Flow
import com.intuit.player.jvm.utils.mocks.ClassLoaderMock
import com.intuit.player.jvm.utils.mocks.ClassLoaderMocksReader
import kotlinx.serialization.json.Json

public val ClassLoaderMocksReader.simpleMock: ClassLoaderMock
    get() = findMockByName("collection-basic") ?: throw PlayerTestException("Could not find mock by name: collection-basic")

public val mocks: ClassLoaderMocksReader by lazy {
    ClassLoaderMocksReader()
}

public val simpleFlowString: String by lazy {
    mocks.simpleMock.getFlow()
}

public val simpleFlow: Flow by lazy {
    Json { ignoreUnknownKeys = true }
        .decodeFromString(Flow.serializer(), simpleFlowString)
}
