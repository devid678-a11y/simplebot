package com.company.dvizhtrue.data

// Common mock classes for testing without Firebase
class MockTask<T>(private val result: T) {
    fun addOnSuccessListener(listener: (T) -> Unit): MockTask<T> {
        // Immediately call success listener for mock tasks
        listener(result)
        return this
    }
    
    fun addOnFailureListener(listener: (Exception) -> Unit): MockTask<T> {
        // Mock success for now, so failure listener is never called
        return this
    }
}

open class MockListenerRegistration {
    fun remove() {
        // Mock: do nothing
    }
    
    open fun onEventsChanged() {
        // Override in subclasses
    }
}
