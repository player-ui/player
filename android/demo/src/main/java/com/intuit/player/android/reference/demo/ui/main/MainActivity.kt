package com.intuit.player.android.reference.demo.ui.main

import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.core.os.bundleOf
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.observe
import androidx.navigation.findNavController
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.*
import com.google.android.material.navigation.NavigationView
import com.intuit.player.android.reference.demo.R
import com.intuit.player.android.reference.demo.model.AssetMock
import com.intuit.player.android.reference.demo.model.StringMock
import com.intuit.player.android.ui.PlayerFragment
import com.intuit.player.jvm.utils.mocks.ClassLoaderMock
import com.intuit.player.jvm.utils.mocks.Mock
import com.intuit.player.jvm.utils.mocks.getFlow

class MainActivity : AppCompatActivity() {

    private lateinit var drawerLayout: DrawerLayout
    private val navConfig by lazy { AppBarConfiguration(navController.graph, drawerLayout) }
    private val navController get() = findNavController(R.id.nav_host_fragment)

    val currentPlayer get() = supportFragmentManager.fragments.filterIsInstance<NavHostFragment>().single().childFragmentManager.fragments.filterIsInstance<PlayerFragment>().firstOrNull()
    val viewModel by lazy {
        ViewModelProvider(this).get(MainViewModel::class.java)
    }

    override fun onSupportNavigateUp(): Boolean {
        return navController.navigateUp(navConfig) || super.onSupportNavigateUp()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_main)

        val storybookNav = findViewById<NavigationView>(R.id.storybook_nav)
        drawerLayout = findViewById(R.id.drawer_layout)

        setSupportActionBar(findViewById(R.id.toolbar))
        setupActionBarWithNavController(navController, navConfig)
        storybookNav.setupWithNavController(navController)
        storybookNav.menu.let(viewModel::groupMocks)
        viewModel.currentMock.observe(this) {
            startFlow(it)
        }
    }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu, menu)

        return true
    }

    override fun onOptionsItemSelected(item: MenuItem) =
        item.onNavDestinationSelected(navController) || when (item.itemId) {
            R.id.action_reset -> {
                currentPlayer?.reset()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }

    override fun onStart() {
        super.onStart()

        // This is for deep linking
        val json = intent?.data?.getQueryParameter("json")
            ?: intent.getStringExtra("json")
        json?.let { viewModel.launch(json) }
    }

    private fun startFlow(mock: Mock<*>) = launchFlow(
        when (mock) {
            is ClassLoaderMock -> mock.getFlow(this.classLoader)
            is AssetMock -> mock.getFlow(this.assets)
            is StringMock -> mock.getFlow("")
            else -> throw IllegalArgumentException("mock of type ${mock::class}[$mock] not supported")
        },
        mock.name
    )

    private fun launchFlow(flow: String, name: String?) {
        drawerLayout.closeDrawer(GravityCompat.START)
        navController.navigate(
            R.id.action_launch_player,
            name?.let {
                bundleOf("name" to name, "flow" to flow)
            } ?: bundleOf("flow" to flow)
        )
    }
}
