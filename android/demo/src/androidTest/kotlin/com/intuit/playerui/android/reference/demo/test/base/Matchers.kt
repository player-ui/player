package com.intuit.playerui.android.reference.demo.test.base

import android.text.Spanned
import android.text.style.ClickableSpan
import android.view.View
import android.widget.TextView
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.PerformException
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.ViewInteraction
import androidx.test.espresso.matcher.ViewMatchers
import androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom
import androidx.test.espresso.matcher.ViewMatchers.isRoot
import androidx.test.espresso.util.HumanReadables
import androidx.test.espresso.util.TreeIterables
import org.hamcrest.Matcher
import org.hamcrest.Matchers
import org.hamcrest.StringDescription
import java.util.concurrent.TimeoutException

fun waitForViewInRoot(
    viewMatcher: Matcher<View>,
    timeout: Long = 10000,
    waitForDisplayed: Boolean = true,
): ViewInteraction {
    onView(isRoot()).perform(waitForView(viewMatcher, timeout, waitForDisplayed))

    return onView(viewMatcher)
}

fun waitForView(
    viewMatcher: Matcher<View>,
    timeout: Long = 10000,
    waitForDisplayed: Boolean = true,
): ViewAction {
    return object : ViewAction {
        override fun getConstraints(): Matcher<View> = Matchers.any(View::class.java)

        override fun getDescription(): String {
            val matcherDescription = StringDescription()
            viewMatcher.describeTo(matcherDescription)
            return "wait for a specific view <$matcherDescription> to be ${
                if (waitForDisplayed) "displayed" else "not displayed during $timeout millis."}"
        }

        override fun perform(uiController: UiController, view: View) {
            uiController.loopMainThreadUntilIdle()
            val startTime = System.currentTimeMillis()
            val endTime = startTime + timeout
            val visibleMatcher = ViewMatchers.isDisplayed()

            do {
                val viewVisible = TreeIterables
                    .breadthFirstViewTraversal(view)
                    .any { viewMatcher.matches(it) && visibleMatcher.matches(it) }

                if (viewVisible == waitForDisplayed) return
                uiController.loopMainThreadForAtLeast(50)
            } while (System.currentTimeMillis() < endTime)

            // Timeout happens.
            throw PerformException
                .Builder()
                .withActionDescription(this.description)
                .withViewDescription(HumanReadables.describe(view))
                .withCause(TimeoutException())
                .build()
        }
    }
}

fun clickClickableSpan(text: CharSequence? = null): ViewAction = object : ViewAction {
    override fun getConstraints(): Matcher<View> = isAssignableFrom(TextView::class.java)

    override fun getDescription() = text
        ?.let { "click ClickableSpan containing \"$it\"" }
        ?: "click the ClickableSpan in this TextView"

    override fun perform(uiController: UiController, view: View) {
        val tv = view as TextView
        val spannable = tv.text as? Spanned ?: throw PerformException
            .Builder()
            .withActionDescription(description)
            .withViewDescription(HumanReadables.describe(view))
            .withCause(IllegalStateException("TextView text is not Spanned"))
            .build()

        val spans = spannable.getSpans(0, spannable.length, ClickableSpan::class.java)
        val span = if (text == null) {
            spans.firstOrNull()
        } else {
            spans.firstOrNull {
                val start = spannable.getSpanStart(it)
                val end = spannable.getSpanEnd(it)
                spannable.subSequence(start, end).toString() == text
            }
        } ?: throw PerformException
            .Builder()
            .withActionDescription(description)
            .withViewDescription(HumanReadables.describe(view))
            .withCause(IllegalStateException(text?.let { "No ClickableSpan with text \"$it\" found" } ?: "No ClickableSpan found"))
            .build()

        span.onClick(view)
    }
}
