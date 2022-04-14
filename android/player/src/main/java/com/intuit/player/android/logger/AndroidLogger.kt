package com.intuit.player.android.logger

import android.util.Log
import com.intuit.player.jvm.core.plugins.LoggerPlugin

/** Default Android logger */
internal class AndroidLogger(val name: String = TAG) : LoggerPlugin {

    companion object {
        private val TAG = AndroidLogger::class.java.simpleName
    }

    override fun trace(vararg args: Any?) {
        Log.v(name, args.joinToString(", "))
    }

    override fun debug(vararg args: Any?) {
        Log.d(name, args.joinToString(", "))
    }

    override fun info(vararg args: Any?) {
        Log.i(name, args.joinToString(", "))
    }

    override fun warn(vararg args: Any?) {
        Log.w(name, args.joinToString(", "))
    }

    override fun error(vararg args: Any?) {
        Log.e(name, args.joinToString(", "))
    }
}
