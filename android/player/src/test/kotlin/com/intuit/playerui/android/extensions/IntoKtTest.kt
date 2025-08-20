package com.intuit.playerui.android.extensions

import android.view.View
import android.view.View.GONE
import android.view.ViewGroup
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.verify
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith

@ExtendWith(MockKExtension::class)
internal class IntoKtTest {
    @MockK
    lateinit var view1: View

    @MockK
    lateinit var view2: View

    @MockK
    lateinit var view3: View

    @MockK
    lateinit var view4: View

    @MockK(relaxed = true)
    lateinit var rootView: ViewGroup

    @BeforeEach
    fun setup() {
        every { view1.parent } answers { rootView }
        every { view2.parent } answers { rootView }
        every { view3.parent } answers { rootView }
        every { view4.parent } answers { rootView }
    }

    @Test
    fun `the root view is hidden if the filtered collection is empty`() {
        listOf(null, null, null) into rootView
        verify {
            rootView.visibility = GONE
            rootView.removeAllViews()
        }
    }

    @Test
    fun `views are inserted into the root view in the correct order`() {
        listOf(view1, view2, view3) into rootView
        verify {
            rootView.addView(view1, 0)
            rootView.addView(view2, 1)
            rootView.addView(view3, 2)
        }
    }

    @Test
    fun `views that are already in the root view and also in the new view are not inserted again`() {
        mockChildIndices()

        listOf(view1, view2, view3) into rootView
        verify(inverse = true) {
            rootView.addView(view1, any<Int>())
        }
    }

    @Test
    fun `views that are not present in updated collection are removed`() {
        var childCount = 3
        mockChildIndices()
        mockChildCount { childCount }
        every { rootView.removeViewAt(any()) } answers { childCount-- }

        listOf(view1, view2) into rootView
        verify { rootView.removeViewAt(2) }
    }

    @Test
    fun `views that are not present in updated collection are removed even with null entries`() {
        var childCount = 3
        mockChildIndices()
        mockChildCount { childCount }
        every { rootView.removeViewAt(any()) } answers { childCount-- }

        listOf(view1, view2, null) into rootView
        verify { rootView.removeViewAt(2) }
    }

    @Test
    fun `views that are different have the old reference removed and the new one added`() {
        mockChildIndices()
        var childCount = 3
        every { rootView.removeViewAt(any()) } answers { childCount-- }

        listOf(view1, view2, view4) into rootView
        verify {
            rootView.removeView(view3)
            rootView.addView(view4, 2)
        }
    }

    private fun mockChildIndices() {
        every { rootView.getChildAt(0) } returns view1
        every { rootView.getChildAt(1) } returns view2
        every { rootView.getChildAt(2) } returns view3
    }

    private fun mockChildCount(childCount: () -> Int) {
        every { rootView.childCount } answers { childCount() }
    }
}
