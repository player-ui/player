package com.intuit.playerui.android.reference.assets.chat

import android.view.ViewGroup
import android.widget.TextView
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.reference.assets.R
import com.intuit.playerui.android.reference.assets.test.AssetTest
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.plugins.asyncnode.AsyncNodePlugin
import org.junit.Assert.assertEquals
import org.junit.Test

public class ChatMessageAssetTest : AssetTest("chat-message") {

    @Test
    fun basic() {
        launchMock("chat-message-basic")

        val messageView = currentView?.findViewById<TextView>(R.id.message_text) ?: throw AssertionError("current view is null")
        assertEquals("This is a chat message", messageView.text.toString())
    }

//    @Test
//    fun noFollowUp() {
//        launchMock("chat-message-no-followup")
//
//        val messageView = currentView?.findViewById<TextView>(R.id.message_text) ?: throw AssertionError("current view is null")
//        assertEquals("This is a chat message", messageView.text.toString())
//
//        val followUpContainer = currentView?.findViewById<ViewGroup>(R.id.follow_up_container)
//        assertEquals(null, followUpContainer)
//    }

//    @Test
//    fun asyncNodeUpdatesContent() = runBlocking {
//        val player = listOf(AsyncNodePlugin())
//
//        val plugins = listOf(AsyncNodePlugin())
//
//        player.asyncNodePlugin!!
//
//        launchMock("chat-message-basic")
//
//        val messageView = currentView?.findViewById<TextView>(R.id.message_text) ?: throw AssertionError("current view is null")
//        assertEquals("This is a chat message", messageView.text.toString())
//
//        val newData = ChatMessageAsset.Data(message = "Updated async message", async = true)
//        player.hooks.onAsyncNode("chat-message-basic", newData)
//
//        val updatedMessageView = currentView?.findViewById<TextView>(R.id.message_text) ?: throw AssertionError("current view is null")
//        assertEquals("Updated async message", updatedMessageView.text.toString())
//    }
}