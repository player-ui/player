//
//  SwiftUIPendingTransactionPlugin.swift
//  iOSPlayer
//
//  Created by Zhao Xia Wu on 2023-11-15.
//

import Foundation
import SwiftUI

/**
 A plugin that allows TransactionContext objects to be registered into the decoder's userInfo that is used to decode the view updates.
 Allows for handling pending transactions on the assets side so users can decide when and where to add new callbacks and commit them
 */
public class SwiftUIPendingTransactionPlugin<T>: NativePlugin where T: Identifiable, T: Hashable {
    public var pluginName: String = "SwiftUIPendingTransactionPlugin"

    /**
     Constructs the SwiftUIPendingTransactionPlugin
     - parameters:
        - keypath: Takes a keypath from the EnvironmentValues extension with generics of the TransactionContext<T> matching a user defined object, `\.transactionContext` which uses TransactionContext<PendingTransactionPhases> is the default.
     */
    public init(keyPath: WritableKeyPath<EnvironmentValues, TransactionContext<T>>) {
        self.keyPath = keyPath
    }

    private let transactionContext = TransactionContext<T>()

    let keyPath: WritableKeyPath<EnvironmentValues, TransactionContext<T>>

    public func apply<P>(player: P) where P: HeadlessPlayer {
        guard let player = player as? SwiftUIPlayer else { return }

        // transactionContext should attach to decoder prior to decoding a view
        player.assetRegistry.decoder.setPendingTransaction(transactionContext)

        player.hooks?.view.tap(name: "SwiftUIPendingTransactionPlugin", { view in
            let keyPath = self.keyPath
            return AnyView(view.environment(keyPath, self.transactionContext))
        })
    }
}

// typealias which uses default PendingTransactionPhases as the generic
public typealias PendingTransactionPhasesPlugin = SwiftUIPendingTransactionPlugin<PendingTransactionPhases>

extension SwiftUIPendingTransactionPlugin where T == PendingTransactionPhases {
    /**
     Convenience init which takes no parameters and uses the \.transactionContext keypath as default if user would like to use PendingTransactionPhases as the Namespace for TransactionContext
     */
    public convenience init() {
        self.init(keyPath: \.transactionContext)
    }
}

/// Represents a specific namespace which is a group of transactions that should be performed together.
/// Extend this struct to add new PendingTransactionPhases
public struct PendingTransactionPhases: RawRepresentable, Identifiable, Hashable {
    public var id: Self { self }
    public var rawValue: String

    public init(rawValue: String) {
        self.rawValue = rawValue
    }
}

/**
 Context object that contains functions to get/set a pending transaction and to call the commit callbacks
 */
public class TransactionContext<Namespace> where Namespace: Identifiable, Namespace: Hashable {
    // Assumes each namespace can have multiple callbacks
    public var callbacks: [Namespace: [() -> Void]] = [:]

    /// Register a pending transaction to the namespace
    public func register(_ namespace: Namespace, _ callback: @escaping () -> Void) {
        if let existing = callbacks[namespace] {
            callbacks[namespace] = existing + [callback]
        } else {
            callbacks[namespace] = [callback]
        }
    }

    /// Commit transactions belonging to the namespace.
    public func commit(_ namespace: Namespace) {
        if let callbacksToCommit = callbacks[namespace] {
            callbacksToCommit.forEach { $0() }
        }
    }

    /// Commit transactions belonging to the namespaces
    public func commit(_ namespaces: [Namespace]) {
        namespaces.forEach { commit($0) }
    }

    /// Clear transactions belonging to the namespace
    public func clear(_ namespace: Namespace) {
       callbacks.removeValue(forKey: namespace)
    }

    /// Clear transactions belonging to the namespaces
    public func clear(_ namespaces: [Namespace]) {
        namespaces.forEach {callbacks.removeValue(forKey: $0)}
    }
}

/// EnvironmentKey for setting a `TransactionContextKey`
internal struct TransactionContextKey: EnvironmentKey {
    /// Default value for this key
    public static let defaultValue: TransactionContext<PendingTransactionPhases> = .init()
}

/// EnvironmentValue for `TransactionContext` for the `SwiftUIPendingTransactionPlugin`
public extension EnvironmentValues {
    /// The `TransactionContext` if it exists in the environment
    var transactionContext: TransactionContext<PendingTransactionPhases> {
        get { self[TransactionContextKey.self] }
        set { self[TransactionContextKey.self] = newValue }
    }
}

public typealias CallbackHandler = () -> Void

/// Callback structure used to preserve registration order in callbacks
public struct Callback {
    public var id: String
    let callback: CallbackHandler
}

public extension CodingUserInfoKey {
    /// A `CodingUserInfoKey` to fetch the pendingTransactionContext for this decoder
    static let pendingTransactionContext: CodingUserInfoKey! = CodingUserInfoKey(rawValue: "pendingTransactionContext")
}

extension JSONDecoder {
    /// Sets the TransactionContext for the user info on the decoder
    func setPendingTransaction<T>(_ transaction: TransactionContext<T>?) {
        userInfo[.pendingTransactionContext] = transaction
    }
}
