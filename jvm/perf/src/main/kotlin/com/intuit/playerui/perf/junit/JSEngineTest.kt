package com.intuit.playerui.perf.junit

import com.intuit.playerui.utils.test.RuntimeTest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestInfo
import java.util.logging.Logger

/** JUnit 5 based [RuntimeTest] extension for measuring time to complete tests */
public abstract class JSEngineTest : RuntimeTest() {
    public val logger: Logger = Logger.getLogger("JSEngineTest")

    public lateinit var testInfo: TestInfo

    public companion object {
        public val objectScript: String =
            """
            var person = {};
            person.name = "Joe";
            person.age = 25;
            function getAge(p) { return p.name + ` is ` + p.age + ` years old` };
            """.trimIndent()
    }

    @BeforeEach
    public fun setup(info: TestInfo) {
        testInfo = info
    }

    public fun captureTime(block: () -> Unit) {
        val startTime = System.nanoTime()
        block.invoke()
        val endTime = System.nanoTime()
        val result = (endTime - startTime).toMS()
        logger.info("PerfResult ${testInfo.displayName} ${result}ms")
    }

    private fun Long.toMS(): Float = this / 1000000F
}
