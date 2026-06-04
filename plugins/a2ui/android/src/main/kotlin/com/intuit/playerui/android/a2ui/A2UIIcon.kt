package com.intuit.playerui.android.a2ui

import androidx.compose.material.Icon
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Done
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.runtime.Composable
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import kotlinx.serialization.Serializable

/**
 * A2UI `Icon` — maps a (possibly kebab/camel-case) icon `name` onto a Material
 * filled icon from `material-icons-core`. Unknown names fall back to an info
 * glyph. A broader icon set would require `material-icons-extended` on the
 * classpath.
 */
@OptIn(ExperimentalPlayerApi::class)
internal class A2UIIcon(
    assetContext: AssetContext,
) : ComposableAsset<A2UIIcon.Data>(assetContext, Data.serializer()) {
    @Serializable
    data class Data(
        val name: String? = null,
        override val accessibility: String? = null,
        override val weight: Double? = null,
    ) : A2UICommon

    @Composable
    override fun content(data: Data) {
        val normalized = data.name?.lowercase()?.replace(Regex("[-_ ]"), "")
        val icon = when (normalized) {
            "add", "plus" -> Icons.Filled.Add
            "arrowback", "back" -> Icons.Filled.ArrowBack
            "arrowforward", "forward", "next" -> Icons.Filled.ArrowForward
            "check", "checkmark" -> Icons.Filled.Check
            "clear" -> Icons.Filled.Clear
            "close", "x" -> Icons.Filled.Close
            "delete", "trash" -> Icons.Filled.Delete
            "done" -> Icons.Filled.Done
            "edit", "pencil" -> Icons.Filled.Edit
            "email", "mail" -> Icons.Filled.Email
            "favorite", "heart" -> Icons.Filled.Favorite
            "home" -> Icons.Filled.Home
            "info" -> Icons.Filled.Info
            "menu" -> Icons.Filled.Menu
            "person", "account", "user" -> Icons.Filled.AccountCircle
            "search" -> Icons.Filled.Search
            "settings", "gear" -> Icons.Filled.Settings
            "star" -> Icons.Filled.Star
            "warning", "alert" -> Icons.Filled.Warning
            else -> Icons.Filled.Info
        }
        Icon(imageVector = icon, contentDescription = data.accessibility ?: data.name)
    }
}
