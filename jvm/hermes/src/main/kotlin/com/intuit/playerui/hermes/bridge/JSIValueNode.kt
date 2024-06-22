package com.intuit.playerui.hermes.bridge

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip

public class JSIValue(@DoNotStrip private val mHybridData: HybridData) {

    public external fun asInt(): Int
    public external fun asBoolean(): Boolean

}
