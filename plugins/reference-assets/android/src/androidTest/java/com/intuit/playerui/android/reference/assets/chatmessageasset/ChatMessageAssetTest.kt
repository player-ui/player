package com.intuit.playerui.android.reference.assets.chatmessageasset

import android.view.ViewGroup
import android.widget.TextView
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.test.AssetTest
import com.intuit.playerui.android.reference.assets.test.shouldBeView
import com.intuit.playerui.plugins.asyncnode.AsyncNodePlugin
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

public class ChatMessageAssetTest : AssetTest("chat-message") {

    private lateinit var asyncNodePlugin: AsyncNodePlugin

    @Test
    fun basic() {
        launchMock("chat-message-basic")

        val messageView = currentView?.findViewById<TextView>(R.id.message_text) ?: throw AssertionError("current view is null")
        assertEquals("This is a chat message", messageView.text.toString())
    }
//
//    @Test
//    fun withAsyncContent() = runBlocking {
//        launchMock("chat-message-async")
//
//        val messageView = currentView?.findViewById<TextView>(R.id.message_text) ?: throw AssertionError("current view is null")
//        assertEquals("This is a chat message with async content", messageView.text.toString())
//
//        val newData = listOf(ChatMessageAsset.Data(message = "Updated async message", async = true))
//        asyncNodePlugin.onAsyncNode("chat-message-async", newData)
//
//        val updatedMessageView = currentView?.findViewById<TextView>(R.id.message_text) ?: throw AssertionError("current view is null")
//        assertEquals("Updated async message", updatedMessageView.text.toString())
//    }
}