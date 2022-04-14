package com.intuit.player.jvm.utils.test

public interface ThreadUtils {

    public val exceptions: MutableList<Throwable>
    public val threads: MutableList<Thread>

    public fun addThreads(vararg threads: Thread) {
        threads.forEach {
            it.setUncaughtExceptionHandler { _, e -> exceptions.add(e); throw e }
            this.threads.add(it)
        }
    }

    public fun startThreads() {
        threads.forEach {
            if (it.state == Thread.State.NEW) it.start()
        }
    }

    public fun verifyThreads() {
        threads.forEach { it.join(10000) }
        exceptions.forEach { throw it }
    }
}
