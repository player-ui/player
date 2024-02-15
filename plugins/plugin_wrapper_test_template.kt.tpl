package @{{package}}

import com.intuit.playerui.utils.test.PlayerTest
import com.intuit.playerui.core.plugins.findPlugin
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.TestTemplate

class @{{plugin_name}}Test : PlayerTest() {

    override val plugins = listOf(@{{plugin_name}}())

    @TestTemplate fun `test plugin is loaded and applied`() {
        Assertions.assertNotNull(player.findPlugin<@{{plugin_name}}>())
    }

}
