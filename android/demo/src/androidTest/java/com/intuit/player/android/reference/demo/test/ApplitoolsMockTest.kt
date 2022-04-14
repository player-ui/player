package com.intuit.player.android.reference.demo.test

import android.content.Intent
import android.net.Uri
import androidx.test.core.app.ApplicationProvider
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.ext.junit.rules.activityScenarioRule
import androidx.test.filters.LargeTest
import com.applitools.eyes.android.espresso.fluent.Target.region
import com.intuit.player.android.reference.demo.R
import com.intuit.player.android.reference.demo.model.AssetMock
import com.intuit.player.android.reference.demo.test.base.ApplitoolsTest
import com.intuit.player.android.reference.demo.ui.main.MainActivity
import com.intuit.player.android.reference.demo.ui.main.MainViewModel
import com.intuit.player.jvm.utils.mocks.ClassLoaderMock
import com.intuit.player.jvm.utils.mocks.Mock
import com.intuit.player.jvm.utils.mocks.getFlow
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized
import java.net.URLEncoder

@LargeTest
@RunWith(Parameterized::class)
class ApplitoolsMockTest(val mock: Mock<*>?) : ApplitoolsTest() {

    companion object {
        @Parameterized.Parameters(name = "{0}")
        @JvmStatic
        fun data() = listOf(null, *MainViewModel(ApplicationProvider.getApplicationContext()).mocks.toTypedArray()).map { arrayOf(it) }
    }

    private val name = mock?.let { "${it.group}|${it.name}" } ?: "default"

    private val intent by lazy {
        mock?.let {
            val flow = URLEncoder.encode(
                when (mock) {
                    is AssetMock -> mock.getFlow(context.assets)
                    is ClassLoaderMock -> mock.getFlow(context.classLoader)
                    else -> throw IllegalArgumentException("unknown mock type: ${mock::class}")
                },
                "UTF-8"
            )

            Intent(context, MainActivity::class.java).apply {
                action = "ACTION_VIEW"
                data = Uri.parse("player://domain.com/demo?json=$flow")
            }
        }
    }

    @get:Rule
    val activityRule = activityScenarioRule<MainActivity>(intent)

    @Test
    fun mockTest() {
        eyes.open("Android Native Player Demo", name) {
            check("load", region(withId(R.id.player_canvas)))
            // TODO: Configure mock specific UI automation
        }
    }
}
