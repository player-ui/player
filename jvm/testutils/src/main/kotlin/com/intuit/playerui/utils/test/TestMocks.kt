package com.intuit.playerui.utils.test

import com.intuit.playerui.core.flow.Flow
import com.intuit.playerui.utils.mocks.ClassLoaderMock
import com.intuit.playerui.utils.mocks.ClassLoaderMocksReader
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
