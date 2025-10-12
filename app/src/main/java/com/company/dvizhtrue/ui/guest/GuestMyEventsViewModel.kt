package com.company.dvizhtrue.ui.guest

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.company.dvizhtrue.data.Event
import com.company.dvizhtrue.data.EventsRepository
import com.company.dvizhtrue.data.AuthRepository
import com.company.dvizhtrue.data.AttendanceRepository
import com.company.dvizhtrue.data.AttendanceLocalRepository
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch

class GuestMyEventsViewModel : ViewModel() {
    private val _events = MutableStateFlow<List<Event>>(emptyList())
    val events: StateFlow<List<Event>> = _events

    private var attendanceReg: ListenerRegistration? = null
    private var eventsReg: ListenerRegistration? = null

    // Keep sources separate and combine
    private val _cloudIds = MutableStateFlow<Set<String>>(emptySet())
    private val localIdsFlow = AttendanceLocalRepository.goingIdsFlow()
    private val _allEvents = MutableStateFlow<List<Event>>(emptyList())

    init {
        // Слушаем события из Firebase с fallback на пустой список
        try {
            // Combine local and cloud attendance
            viewModelScope.launch {
                combine(
                    _cloudIds,
                    localIdsFlow,
                    _allEvents
                ) { cloudIds, localIds, allEvents ->
                    val allIds = cloudIds + localIds
                    allEvents.filter { event -> allIds.contains(event.id) }
                }.collect { filteredEvents ->
                    _events.value = filteredEvents
                    android.util.Log.d("GuestMyEventsViewModel", "Events loaded: ${filteredEvents.size}")
                }
            }

            // Listen to all events
            viewModelScope.launch {
                try {
                    EventsRepository.listenEvents().collect { events ->
                        _allEvents.value = events
                    }
                } catch (e: Exception) {
                    android.util.Log.e("GuestMyEventsViewModel", "Error loading events", e)
                    _allEvents.value = emptyList()
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("GuestMyEventsViewModel", "Error loading Firebase data", e)
            _events.value = emptyList()
        }
    }

    override fun onCleared() {
        attendanceReg?.remove()
        eventsReg?.remove()
        super.onCleared()
    }
}
