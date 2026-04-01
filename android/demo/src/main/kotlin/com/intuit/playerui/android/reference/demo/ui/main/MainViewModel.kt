package com.intuit.playerui.android.reference.demo.ui.main

import android.app.Application
import android.view.Menu
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.intuit.playerui.android.reference.demo.model.AssetMock
import com.intuit.playerui.android.reference.demo.model.StringMock
import com.intuit.playerui.utils.mocks.ClassLoaderMocksReader
import com.intuit.playerui.utils.mocks.Mock
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import java.io.FileNotFoundException

class MainViewModel(
    private val context: Application,
) : AndroidViewModel(context) {
    val mocks: List<Mock<out Any?>> by lazy {
        readMocksFromClasspath() + readMocksFromAssets()
    }

    val defaultMock by lazy {
        AssetMock("", "default", "mocks/default.json")
    }

    private val _currentMock = MutableSharedFlow<Mock<*>>()

    /** [currentMock] LiveData that represents the mock that is currently displayed */
    val currentMock: SharedFlow<Mock<*>> = _currentMock.asSharedFlow()

    fun launch(json: String) = launch(StringMock(json))

    fun launch(mock: Mock<*>) = viewModelScope.launch {
        _currentMock.emit(mock)
    }

    private fun readMocksFromClasspath() = ClassLoaderMocksReader(MainViewModel::class.java.classLoader!!).mocks

    private fun readMocksFromAssets(path: String = "mocks"): List<Mock<*>> = context.assets
        .list(path)
        ?.map { if (path.isEmpty()) it else "$path/$it" }
        ?.flatMap { file ->
            try {
                // Check if file can be opened
                context.assets.open(file).close()
                val (group, name) = "/$file".removeSuffix(".json").split("/").takeLast(2)
                listOf(AssetMock(group, name, file))
            } catch (e: FileNotFoundException) {
                readMocksFromAssets(file)
            }
        } ?: emptyList()

    fun groupMocks(menu: Menu) {
        mocks
            .groupBy { it.group }
            .map { (group, mocks) -> menu.addSubMenu(group) to mocks }
            .map { (group, mocks) ->
                mocks.mapIndexed { index, mock ->
                    group.add(Menu.NONE, index, index, mock.name).setOnMenuItemClickListener {
                        launch(mock)
                        true
                    }
                }
            }
    }

    fun randomize() = launch(mocks.random())
}
