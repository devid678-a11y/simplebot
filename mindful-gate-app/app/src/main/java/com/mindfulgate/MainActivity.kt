package com.mindfulgate

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mindfulgate.data.MindfulRepository
import com.mindfulgate.ui.MainScreen
import com.mindfulgate.ui.MainViewModel
import com.mindfulgate.ui.MainViewModelFactory
import com.mindfulgate.ui.theme.MindfulGateTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val repository = MindfulRepository(this)
        val viewModelFactory = MainViewModelFactory(repository)
        
        setContent {
            MindfulGateTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val viewModel: MainViewModel = viewModel(factory = viewModelFactory)
                    MainScreen(viewModel = viewModel)
                }
            }
        }
    }
}

