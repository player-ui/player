package com.intuit.playerui.android.reference.demo.model

import com.intuit.playerui.utils.mocks.Mock

class StringMock(
    private val json: String,
    override val group: String = "",
    override val name: String = "Player",
    override val path: String = "",
) : Mock<Any> {
    override fun read(source: Any) = json
}
