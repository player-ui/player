package com.intuit.player.plugins.transactions

import com.intuit.hooks.HookContext
import com.intuit.hooks.SyncHook
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.core.plugins.findPlugin

public fun interface PendingTransaction {
    public fun commit()
}

public class PendingTransactionPlugin : Plugin {

    public class PendingTransactionHooks {
        public class RegisterHook : SyncHook<(HookContext) -> Unit>() {
            public fun call(): Unit = super.call { f, hookCtx -> f(hookCtx) }
        }
        public class CommitHook : SyncHook<(HookContext) -> Unit> () {
            public fun call(): Unit = super.call { f, hookCtx -> f(hookCtx) }
        }
        public val register: RegisterHook = RegisterHook()
        public val commit: CommitHook = CommitHook()
    }

    public val hooks: PendingTransactionHooks = PendingTransactionHooks()

    public fun register(pendingTransaction: PendingTransaction) {
        hooks.register.call()
        hooks.commit.tap(name = PENDING_TRANSACTION_ID, id = PENDING_TRANSACTION_ID) {
            pendingTransaction.commit()
            hooks.commit.untap(PENDING_TRANSACTION_ID)
        }
    }

    public fun commit() {
        hooks.commit.call()
    }

    private companion object {
        const val PENDING_TRANSACTION_ID = "pending-transaction"
    }
}

public val Player.pendingTransactionPlugin: PendingTransactionPlugin? get() = findPlugin()

public fun Player.registerPendingTransaction(pendingTransaction: PendingTransaction) {
    pendingTransactionPlugin?.register(pendingTransaction)
}

public fun Player.commitPendingTransaction() {
    pendingTransactionPlugin?.commit()
}
