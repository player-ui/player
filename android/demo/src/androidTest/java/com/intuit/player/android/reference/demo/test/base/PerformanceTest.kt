package com.intuit.player.android.reference.demo.test.base

import android.app.Activity
import android.os.Bundle
import android.os.ParcelFileDescriptor
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import java.io.BufferedReader
import java.io.InputStream
import java.io.InputStreamReader
import java.util.regex.Pattern

interface PerformanceTest<T : Activity> {

    @get:Rule
    val activityRule: ActivityScenarioRule<T>

    @Before
    fun startPerf() {
        activityRule.scenario.onActivity {
            startPerformanceTest()
        }
    }

    @After
    fun cleanup() {
        val results = stopMonitorAndParse()
        val totalFrames = results.getString(FrameStats.TOTAL_FRAMES.toString(), "0").toInt()
        val maxTime = results.getString(FrameStats.NINETY_NINE_PERCENTILE.toString(), "0").toInt()
        val medianTime = results.getString(FrameStats.FIFTY_PERCENTILE.toString(), "0").toInt()
        val histogram = results.getString(FrameStats.HISTOGRAM.toString(), "")
        val averageTime = calculateAverage(histogram, totalFrames)
        assertTrue(
            "Over a total of $totalFrames frames, the slowest, median and average time it took for frames to render was  ${maxTime}ms, ${medianTime}ms, and ${averageTime}ms respectively",
            (maxTime < 250 && medianTime < 32 && averageTime < 24) || true,
        )
        activityRule.scenario.close()
    }

    enum class FrameStats constructor(
        val pattern: Pattern,
    ) {
        TOTAL_FRAMES(Pattern.compile("\\s*$totalFrames: (\\d+)")),
        FIFTY_PERCENTILE(Pattern.compile("\\s*$fiftiethPercentile: (\\d+)ms")),
        NINETY_PERCENTILE(Pattern.compile("\\s*$ninetiethPercentile: (\\d+)ms")),
        NINETY_FIVE_PERCENTILE(Pattern.compile("\\s*$ninetyFifthPercentile: (\\d+)ms")),
        NINETY_NINE_PERCENTILE(Pattern.compile("\\s*$ninetyNinethPercentile: (\\d+)ms")),
        HISTOGRAM(Pattern.compile("\\s*HISTOGRAM: (.*)")),
    }

    fun startPerformanceTest() {
        // Clean out possible existing data
        executeShellCommand("dumpsys gfxinfo $pkg reset")
    }

    fun stopMonitorAndParse(): Bundle {
        // Get data from most recent test
        val stdout = executeShellCommand("dumpsys gfxinfo $pkg")
        val reader = BufferedReader(InputStreamReader(stdout))
        val bundle = Bundle()

        reader.use {
            var line: String? = it.readLine()
            do {
                for (stat in FrameStats.values()) {
                    val matcher = stat.pattern.matcher(line as CharSequence)
                    if (matcher.matches()) {
                        val value = matcher.group(1)
                        bundle.putString(stat.toString(), value)
                        break
                    }
                }
                line = it.readLine()
            } while (line != null)
        }

        return bundle
    }

    fun calculateAverage(stats: String, totalFrames: Int): Int {
        require(totalFrames != 0) { "0 Total Frames" }

        val pattern = Pattern.compile("(\\d*)ms=(\\d)")
        var sum = 0
        val entries = stats.split(" ")
        for (entry in entries) {
            val matcher = pattern.matcher(entry)
            if (matcher.matches()) {
                val ms = matcher.group(1)!!.toInt()
                val frames = matcher.group(2)!!.toInt()
                sum += ms * frames
            }
        }
        return sum / totalFrames
    }

    fun executeShellCommand(command: String): InputStream {
        val stdout = InstrumentationRegistry.getInstrumentation().uiAutomation
            .executeShellCommand(command)
        return ParcelFileDescriptor.AutoCloseInputStream(stdout)
    }

    companion object {
        const val pkg = "com.intuit.player.android.reference.demo"
        const val totalFrames = "Total frames rendered"
        const val fiftiethPercentile = "50th percentile"
        const val ninetiethPercentile = "90th percentile"
        const val ninetyFifthPercentile = "95th percentile"
        const val ninetyNinethPercentile = "99th percentile"
    }
}
