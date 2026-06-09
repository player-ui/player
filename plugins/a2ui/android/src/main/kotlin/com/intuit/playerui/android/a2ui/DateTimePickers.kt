package com.intuit.playerui.android.a2ui

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Context
import java.util.Calendar

/**
 * Native date/time picker helpers shared by `A2UITextField` (date type) and
 * `A2UIDateTimeInput`. Values are emitted as ISO-8601 strings to match the core
 * transform's model representation (React relies on the browser's native pickers
 * producing ISO values for `<input type="date">`/`time`/`datetime-local`).
 */
internal object DateTimePickers {
    /** Opens a native date picker, emitting an ISO date (`yyyy-MM-dd`) on selection. */
    fun showDatePicker(
        context: Context,
        current: String?,
        onPicked: (String) -> Unit,
    ) {
        val cal = parseDate(current) ?: Calendar.getInstance()
        DatePickerDialog(
            context,
            { _, year, month, day -> onPicked(formatDate(year, month, day)) },
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH),
            cal.get(Calendar.DAY_OF_MONTH),
        ).show()
    }

    /** Opens a native time picker, emitting an ISO time (`HH:mm`) on selection. */
    fun showTimePicker(
        context: Context,
        current: String?,
        onPicked: (String) -> Unit,
    ) {
        val cal = parseTime(current) ?: Calendar.getInstance()
        TimePickerDialog(
            context,
            { _, hour, minute -> onPicked(formatTime(hour, minute)) },
            cal.get(Calendar.HOUR_OF_DAY),
            cal.get(Calendar.MINUTE),
            true,
        ).show()
    }

    private fun formatDate(
        year: Int,
        month: Int,
        day: Int,
    ): String = "%04d-%02d-%02d".format(year, month + 1, day)

    private fun formatTime(hour: Int, minute: Int): String = "%02d:%02d".format(hour, minute)

    private fun parseDate(value: String?): Calendar? {
        // Accept a leading ISO date (optionally followed by a time component).
        val match = value?.let { Regex("""(\d{4})-(\d{2})-(\d{2})""").find(it) } ?: return null
        val (y, m, d) = match.destructured
        return Calendar.getInstance().apply { set(y.toInt(), m.toInt() - 1, d.toInt()) }
    }

    private fun parseTime(value: String?): Calendar? {
        val match = value?.let { Regex("""(\d{2}):(\d{2})""").find(it) } ?: return null
        val (h, min) = match.destructured
        return Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, h.toInt())
            set(Calendar.MINUTE, min.toInt())
        }
    }
}
