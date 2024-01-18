//
//  JSValue+Extensions.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-01-18.
//

import Foundation
import JavaScriptCore

extension JSValue {
    var tryCatchWrapper: JSValue? {
        self.context.evaluateScript(
        """
           (fn, args) => {
               try {
                   console.log(args)
                   return fn(...args)
               } catch(e) {
                   console.log(e)
                   if (e instanceof Error) {

                      return e
                }
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


    /**
     A way to catch errors for void functions not called inside a player process. Called on void functions.
     - parameters:
        - args: List of arguments taken by the function
     */
    public func callTryCatchWrapper(args: Any...) throws {
        let result = self.tryCatchWrapper?.call(withArguments: [self, args])

        let isError = self.errorCheckWrapper?.call(withArguments: [result as Any])

        if isError?.toBool() == true {
            throw JSValueError.thrownFromJS
        }
    }


    /**
     A way to catch errors for functions not called inside a player process. Called on functions with a return value.
     - parameters:
        - args: List of arguments taken by the function
     */
    public func callTryCatchWrapperWithReturnValue(args: Any...) throws -> JSValue? {
         let result = tryCatchWrapper?.call(withArguments: [self, args])

        let isError = self.errorCheckWrapper?.call(withArguments: [result as Any])

        if isError?.toBool() == true {
            throw JSValueError.thrownFromJS
        } else {
            return result
        }
    }
}

/**
 Represents the different errors that occur when evaluating JSValue
 */
public enum JSValueError: Error {
    case thrownFromJS
}
