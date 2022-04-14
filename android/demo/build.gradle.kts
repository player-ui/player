plugins {
    androidx("navigation.safeargs.kotlin")
}

android {
    buildTypes.all {
        buildConfigField("String", "APPLITOOLS_API_KEY", "\"${System.getenv("APPLITOOLS_API_KEY")}\"")
        buildConfigField("String", "APPLITOOLS_BATCH_ID", "\"${System.getenv("APPLITOOLS_BATCH_ID") ?: "local"}\"")
    }

    packagingOptions {
        exclude("META-INF/core.kotlin_module")
    }
}

val CORE_PLAYER_VERSION: String by project
val JVM_PLAYER_VERSION: String by project
val WEB_PLAYER_VERSION: String by project
val INSTANT_APPS_VERSION: String by project
val ANDROIDX_APPCOMPAT_VERSION: String by project
val ANDROIDX_CORE_VERSION: String by project
val ANDROIDX_CONSTRAINT_VERSION: String by project
val ANDROIDX_NAVIGATION_VERSION: String by project
val MATERIAL_DIALOG_VERSION: String by project
val LEAK_CANARY_VERSION: String by project
val APPLITOOLS_VERSION: String by project

dependencies {
    implementation("com.intuit.player.jvm:j2v8-android:$JVM_PLAYER_VERSION")
    implementation(project(":player"))
    implementation(project(":assets"))
    implementation(project(":plugins:private-data-masking-android"))

    implementation("com.google.android.gms:play-services-instantapps:$INSTANT_APPS_VERSION")
    implementation("androidx.appcompat:appcompat:$ANDROIDX_APPCOMPAT_VERSION")
    implementation("androidx.core:core-ktx:$ANDROIDX_CORE_VERSION")
    implementation("androidx.constraintlayout:constraintlayout:$ANDROIDX_CONSTRAINT_VERSION")
    implementation("androidx.navigation:navigation-fragment-ktx:$ANDROIDX_NAVIGATION_VERSION")
    implementation("androidx.navigation:navigation-ui-ktx:$ANDROIDX_NAVIGATION_VERSION")

    implementation("com.intuit.player.plugins:common-types:$CORE_PLAYER_VERSION")
    implementation("com.intuit.player.plugins:sensitive-data:$CORE_PLAYER_VERSION")
    implementation("com.intuit.player.jvm:utils:$JVM_PLAYER_VERSION")
    implementation("com.intuit.player.reference:mocks:$WEB_PLAYER_VERSION")

    implementation("com.afollestad.material-dialogs:core:$MATERIAL_DIALOG_VERSION")
    implementation("com.squareup.leakcanary:leakcanary-android:$LEAK_CANARY_VERSION")

    androidTestImplementation("com.intuit.player.jvm:utils:$JVM_PLAYER_VERSION")
    androidTestImplementation("com.applitools:eyes-android-espresso:$APPLITOOLS_VERSION@aar")
    androidTestImplementation("com.applitools:eyes-android-common:$APPLITOOLS_VERSION")
    androidTestImplementation("com.applitools:eyes-android-core:$APPLITOOLS_VERSION")
    androidTestImplementation("com.applitools:eyes-android-components:$APPLITOOLS_VERSION@aar")
    androidTestImplementation("com.applitools:eyes-android-components-androidx:$APPLITOOLS_VERSION@aar")
}
