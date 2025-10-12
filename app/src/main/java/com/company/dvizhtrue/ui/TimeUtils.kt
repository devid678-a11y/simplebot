package com.company.dvizhtrue.ui

import java.util.Calendar
import java.util.concurrent.TimeUnit

fun formatTime(millis: Long): String {
    val cal = Calendar.getInstance().apply { timeInMillis = millis }
    val y = cal.get(Calendar.YEAR)
    val m = cal.get(Calendar.MONTH) + 1
    val d = cal.get(Calendar.DAY_OF_MONTH)
    val h = cal.get(Calendar.HOUR_OF_DAY)
    val min = cal.get(Calendar.MINUTE)
    return String.format("%02d.%02d.%04d %02d:%02d", d, m, y, h, min)
}

fun formatRelativeTime(millis: Long): String {
    val now = System.currentTimeMillis()
    val startOfToday = Calendar.getInstance().apply {
        timeInMillis = now
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }.timeInMillis
    val startOfTomorrow = startOfToday + TimeUnit.DAYS.toMillis(1)
    val startOfDayAfter = startOfToday + TimeUnit.DAYS.toMillis(2)

    val timeStr = formatTime(millis).substringAfter(" ")

    return when {
        millis in startOfToday until startOfTomorrow -> "Сегодня, $timeStr"
        millis in startOfTomorrow until startOfDayAfter -> "Завтра, $timeStr"
        else -> {
            val cal = Calendar.getInstance().apply { timeInMillis = millis }
            val day = arrayOf("Вс","Пн","Вт","Ср","Чт","Пт","Сб")[cal.get(Calendar.DAY_OF_WEEK) - 1]
            val date = String.format("%02d %s", cal.get(Calendar.DAY_OF_MONTH),
                arrayOf("янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек")[cal.get(Calendar.MONTH)])
            "$day, $date, $timeStr"
        }
    }
}


