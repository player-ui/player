//
//  JSValue+Extensions.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-01-18.
//

import Foundation
import JavaScriptCore

extension JSValue {


    /**
     A way to catch errors for functions not called inside a player process. Can be called on functions with a return value and void with discardableResult.
     - parameters:
        - args: List of arguments taken by the function
     */
    @discardableResult
    public func tryCatch(args: Any...) throws -> JSValue? {
        var tryCatchWrapper: JSValue? {
            self.context.evaluateScript(
            """
               (fn, args) => {
                   try {
                       return fn(...args)
                   } catch(e) {
                       return e
                   }
               }
            """)
        }

        var errorCheckWrapper: JSValue? {
            self.context.evaluateScript(
            """
                    (obj) => (obj instanceof Error)
            """)
        }
        let result = tryCatchWrapper?.call(withArguments: [self, args])

        let isError = errorCheckWrapper?.call(withArguments: [result as Any])

        let errorMessage = result?.toString() ?? ""

        if isError?.toBool() == true {
            throw JSValueError.thrownFromJS(message: errorMessage)
        } else {
            return result
        }
    }
}

/**
 Represents the different errors that occur when evaluating JSValue
 */
public enum JSValueError: Error, Equatable {
    case thrownFromJS(message: String)
}