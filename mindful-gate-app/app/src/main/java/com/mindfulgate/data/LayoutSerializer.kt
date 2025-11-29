package com.mindfulgate.data

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import com.google.gson.*
import java.lang.reflect.Type

class ColorSerializer : JsonSerializer<Color>, JsonDeserializer<Color> {
    override fun serialize(src: Color, typeOfSrc: Type, context: JsonSerializationContext): JsonElement {
        return JsonPrimitive(src.value.toString())
    }
    
    override fun deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext): Color {
        return Color(json.asString.toULong())
    }
}

class FontWeightSerializer : JsonSerializer<FontWeight>, JsonDeserializer<FontWeight> {
    override fun serialize(src: FontWeight, typeOfSrc: Type, context: JsonSerializationContext): JsonElement {
        return JsonPrimitive(src.weight)
    }
    
    override fun deserialize(json: JsonElement, typeOfT: Type, context: JsonDeserializationContext): FontWeight {
        val weight = json.asInt
        return when (weight) {
            100 -> FontWeight.Thin
            200 -> FontWeight.ExtraLight
            300 -> FontWeight.Light
            400 -> FontWeight.Normal
            500 -> FontWeight.Medium
            600 -> FontWeight.SemiBold
            700 -> FontWeight.Bold
            800 -> FontWeight.ExtraBold
            900 -> FontWeight.Black
            else -> FontWeight.Normal
        }
    }
}

