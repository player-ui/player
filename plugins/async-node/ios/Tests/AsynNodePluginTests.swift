//
//  AsyncNodePluginTests.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-02-05.
//

import Foundation
import XCTest
import SwiftUI
import JavaScriptCore

@testable import PlayerUI
@testable import PlayerUITestUtilitiesCore
@testable import PlayerUIReferenceAssets
@testable import PlayerUIAsyncNodePlugin

class AsyncNodePluginTests: XCTestCase {
    
    func testConstructionAsyncPlugin() {
        let context = JSContext()
        let plugin = AsyncNodePlugin { _,_ in
            return .singleNode(.concrete(JSValue()))
        }
        plugin.context = context
        
        XCTAssertNotNil(plugin.pluginRef)
    }
    
    func testConstructionAsyncPluginPlugin() {
        let context = JSContext()
        
        let plugin = AsyncNodePluginPlugin()
        plugin.context = context
        
        XCTAssertNotNil(plugin.pluginRef)
    }
    
    
    func testAsyncNodeWithAnotherAsyncNodeDelay() {
        let handlerExpectation = XCTestExpectation(description: "first data did not change")
        
        let context = JSContext()
        
        var count = 0
        
        let resolveHandler: AsyncHookHandler = { _,_ in
            handlerExpectation.fulfill()
            
            sleep(3)
            return .singleNode(.concrete(context?.evaluateScript("""
                    ([
                        {"asset": {"id": "text", "type": "text", "value":"new node from the hook 1"}}
                       ])
                    """) ?? JSValue()))
        }
        
        let asyncNodePluginPlugin = AsyncNodePluginPlugin()
        let plugin = AsyncNodePlugin(plugins: [asyncNodePluginPlugin], resolveHandler)
        
        plugin.context = context
        
        XCTAssertNotNil(asyncNodePluginPlugin.context)
        
        let player = HeadlessPlayerImpl(plugins: [ReferenceAssetsPlugin(), plugin], context: context ?? JSContext())
        
        let textExpectation = XCTestExpectation(description: "newText1 found")
        
        var expectedMultiNode1Text: String = ""
        
        player.hooks?.viewController.tap({ (viewController) in
            viewController.hooks.view.tap { (view) in
                view.hooks.onUpdate.tap { val in
                    count += 1
                    
                    if count == 2 {
                        let newText1 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectAtIndexedSubscript(0)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString1 = newText1?.toString() else { return XCTFail("newText1 was not a string") }
                        
                        expectedMultiNode1Text = textString1
                        textExpectation.fulfill()
                    }
                }
            }
        })
        
        player.start(flow: .asyncNodeJson, completion: {_ in})
        
        wait(for: [handlerExpectation, textExpectation], timeout: 5)
        
        XCTAssert(count == 2)
        XCTAssertEqual(expectedMultiNode1Text, "new node from the hook 1")
    }
    
    func testReplaceAsyncNodeWithChainedMultiNodes() {
        let handlerExpectation = XCTestExpectation(description: "first data did not change")
        
        let context = JSContext()
        var count = 0
        
        let resolve: AsyncHookHandler = { _,_ in
            handlerExpectation.fulfill()
            
            if count == 1 {
                return .multiNode([
                    ReplacementNode.concrete(context?.evaluateScript("""
                        (
                            {"asset": {"id": "text", "type": "text", "value":"1st value in the multinode"}}
                           )
                        """) ?? JSValue()),
                    ReplacementNode.encodable(AsyncNode(id: "id"))])
            } else if count == 2 {
                return .multiNode([
                    ReplacementNode.encodable(AssetPlaceholderNode(asset: PlaceholderNode(id: "text-2", type: "text", value: "2nd value in the multinode"))),
                    ReplacementNode.encodable(AsyncNode(id: "id-1"))])
            } else if count == 3 {
                return .singleNode(ReplacementNode.encodable(
                    AssetPlaceholderNode(asset: PlaceholderNode(id: "text", type: "text", value: "3rd value in the multinode"))
                ))
            }
            
            return .singleNode(ReplacementNode.concrete(context?.evaluateScript("") ?? JSValue()))
        }
        
        let asyncNodePluginPlugin = AsyncNodePluginPlugin()
        let plugin = AsyncNodePlugin(plugins: [asyncNodePluginPlugin], resolve)
        
        plugin.context = context
        
        XCTAssertNotNil(asyncNodePluginPlugin.context)
        
        let player = HeadlessPlayerImpl(plugins: [ReferenceAssetsPlugin(), plugin], context: context ?? JSContext())
        
        let textExpectation = XCTestExpectation(description: "newText found")
        let textExpectation2 = XCTestExpectation(description: "newText found")
        let textExpectation3 = XCTestExpectation(description: "newText found")
        
        var expectedMultiNode1Text: String = ""
        var expectedMultiNode2Text: String = ""
        var expectedMultiNode3Text: String = ""
        
        player.hooks?.viewController.tap({ (viewController) in
            viewController.hooks.view.tap { (view) in
                view.hooks.onUpdate.tap { val in
                    count += 1
                    
                    if count == 2 {
                        let newText1 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectAtIndexedSubscript(0)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString1 = newText1?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedMultiNode1Text = textString1
                        textExpectation.fulfill()
                    }
                    
                    if count == 3 {
                        let newText2 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectAtIndexedSubscript(1)
                            .objectAtIndexedSubscript(0)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString2 = newText2?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedMultiNode2Text = textString2
                        
                        textExpectation2.fulfill()
                    }
                    
                    if count == 4 {
                        let newText3 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectAtIndexedSubscript(1)
                            .objectAtIndexedSubscript(1)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString3 = newText3?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedMultiNode3Text = textString3
                        textExpectation3.fulfill()
                    }
                }
            }
        })
        
        player.start(flow: .asyncNodeJson, completion: { _ in})
        
        wait(for: [handlerExpectation, textExpectation], timeout: 5)
        
        XCTAssert(count == 2)
        XCTAssertEqual(expectedMultiNode1Text, "1st value in the multinode")
        
        wait(for: [textExpectation2], timeout: 6)
        
        XCTAssert(count == 3)
        XCTAssertEqual(expectedMultiNode2Text, "2nd value in the multinode")
        
        wait(for: [textExpectation3], timeout: 7)
        
        XCTAssert(count == 4)
        XCTAssertEqual(expectedMultiNode3Text, "3rd value in the multinode")
    }
    
    func testAsyncNodeReplacementWithChainedMultiNodesSinglular() {
        let handlerExpectation = XCTestExpectation(description: "first data did not change")
        
        let context = JSContext()
        
        var count = 0
        
        let resolve: AsyncHookHandler = { _,_ in
            handlerExpectation.fulfill()
            
            if count == 1 {
                return .multiNode([
                    ReplacementNode.encodable(AssetPlaceholderNode(asset: PlaceholderNode(id: "text", type: "text", value: "new node from the hook 1"))),
                    ReplacementNode.encodable(AsyncNode(id: "id"))
                ])
            } else if count == 2 {
                return .singleNode(.concrete(context?.evaluateScript("""
                (
                    {"asset": {"id": "text", "type": "text", "value":"new node from the hook 2"}}
                   )
                """) ?? JSValue()))
            }
            
            return .singleNode(ReplacementNode.concrete(context?.evaluateScript("") ?? JSValue()))
        }
        
        let asyncNodePluginPlugin = AsyncNodePluginPlugin()
        let plugin = AsyncNodePlugin(plugins: [asyncNodePluginPlugin], resolve)
        
        plugin.context = context
        
        XCTAssertNotNil(asyncNodePluginPlugin.context)
        
        let player = HeadlessPlayerImpl(plugins: [ReferenceAssetsPlugin(), plugin], context: context ?? JSContext())
        
        let textExpectation = XCTestExpectation(description: "newText found")
        let textExpectation2 = XCTestExpectation(description: "newText found")
        
        var expectedMultiNode1Text: String = ""
        var expectedMultiNode2Text: String = ""
        
        player.hooks?.viewController.tap({ (viewController) in
            viewController.hooks.view.tap { (view) in
                view.hooks.onUpdate.tap { val in
                    count += 1
                    
                    if count == 2 {
                        let newText1 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectAtIndexedSubscript(0)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString1 = newText1?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedMultiNode1Text = textString1
                        textExpectation.fulfill()
                    }
                    
                    if count == 3 {
                        let newText2 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectAtIndexedSubscript(1)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString2 = newText2?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedMultiNode2Text = textString2
                        textExpectation2.fulfill()
                        
                    }
                }
            }
        })
        
        player.start(flow: .asyncNodeJson, completion: { _ in})
        
        wait(for: [handlerExpectation, textExpectation], timeout: 5)
        
        XCTAssert(count == 2)
        XCTAssertEqual(expectedMultiNode1Text, "new node from the hook 1")
        
        wait(for: [textExpectation2], timeout: 5)
        
        XCTAssert(count == 3)
        XCTAssertEqual(expectedMultiNode2Text, "new node from the hook 2")
    }
    
    func testHandleEmptyNode() {
        let handlerExpectation = XCTestExpectation(description: "first data did not change")
        
        guard let context = JSContext() else {
            XCTFail("JSContext initialization failed")
            return
        }
        
        var count = 0
        var args: JSValue?
        var callbackFunction: JSValue?
        
        let resolve: AsyncHookHandler = { node, callback in
            handlerExpectation.fulfill()
            callbackFunction = callback
            
            return .singleNode(.concrete(context.evaluateScript("""
            (
                {"asset": {"id": "text", "type": "text", "value":"new node from the hook 1"}}
            )
        """) ?? JSValue()))
        }
        
        let asyncNodePluginPlugin = AsyncNodePluginPlugin()
        let plugin = AsyncNodePlugin(plugins: [asyncNodePluginPlugin], resolve)
        
        plugin.context = context
        
        XCTAssertNotNil(asyncNodePluginPlugin.context)
        
        let player = HeadlessPlayerImpl(plugins: [ReferenceAssetsPlugin(), plugin], context: context)
        
        let textExpectation = XCTestExpectation(description: "newText found")
        let textExpectation2 = XCTestExpectation(description: "newText found")
        
        var expectedMultiNode1Text: String = ""
        var expectedMultiNode2Text: String = ""
        
        player.hooks?.viewController.tap({ (viewController) in
            viewController.hooks.view.tap { (view) in
                view.hooks.onUpdate.tap { val in
                    count += 1
                    
                    if count == 2 {
                        let newText1 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString1 = newText1?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedMultiNode1Text = textString1
                        textExpectation.fulfill()
                    }
                    
                    if count == 3 {
                        let newText2 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString2 = newText2?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedMultiNode2Text = textString2
                        textExpectation2.fulfill()
                    }
                }
            }
        })
        
        player.start(flow: .asyncNodeJson, completion: { _ in})
        
        wait(for: [handlerExpectation, textExpectation], timeout: 5)
        
        XCTAssert(count == 2)
        XCTAssertEqual(expectedMultiNode1Text, "new node from the hook 1")
        
        let replacementResult = AsyncNodeHandlerType.emptyNode
        
        args = replacementResult.handlerTypeToJSValue(context: context ?? JSContext())
        
        let _ = callbackFunction?.call(withArguments: [args])
        
        XCTAssert(count == 3)
        XCTAssertEqual(expectedMultiNode2Text, "undefined")
    }
    
    
    func testHandleMultipleUpdatesThroughCallback() {
        
        let handlerExpectation = XCTestExpectation(description: "first data did not change")
        
        guard let context = JSContext() else {
            XCTFail("JSContext initialization failed")
            return
        }
        
        var count = 0
        var args: JSValue?
        var callbackFunction: JSValue?
        
        let resolve: AsyncHookHandler = { node, callback in
            handlerExpectation.fulfill()
            callbackFunction = callback
            
            return .singleNode(.concrete(context.evaluateScript("""
            (
                {"asset": {"id": "text", "type": "text", "value":"new node from the hook 1"}}
            )
        """) ?? JSValue()))
        }
        
        let asyncNodePluginPlugin = AsyncNodePluginPlugin()
        let plugin = AsyncNodePlugin(plugins: [asyncNodePluginPlugin], resolve)
        
        plugin.context = context
        
        XCTAssertNotNil(asyncNodePluginPlugin.context)
        
        let player = HeadlessPlayerImpl(plugins: [ReferenceAssetsPlugin(), plugin], context: context)
        
        let textExpectation = XCTestExpectation(description: "newText found")
        let textExpectation2 = XCTestExpectation(description: "newText found")
        let textExpectation3 = XCTestExpectation(description: "newText found")
        
        var expectedMultiNode1Text: String = ""
        var expectedMultiNode2Text: String = ""
        var expectedMultiNode3Text: String = ""
        var expectedMultiNode4Text: String = ""
        
        player.hooks?.viewController.tap({ (viewController) in
            viewController.hooks.view.tap { (view) in
                view.hooks.onUpdate.tap { val in
                    count += 1
                    
                    if count == 2 {
                        let newText1 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString1 = newText1?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedMultiNode1Text = textString1
                        textExpectation.fulfill()
                    }
                    
                    if count == 3 {
                        let newText2 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString2 = newText2?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedMultiNode2Text = textString2
                        textExpectation2.fulfill()
                    }
                    
                    if count == 4 {
                        
                        let newText3 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(0)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("label")
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString3 = newText3?.toString() else { return XCTFail("newText was not a string") }
                        
                        let newText4 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString4 = newText4?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedMultiNode3Text = textString3
                        expectedMultiNode4Text = textString4
                        textExpectation3.fulfill()
                    }
                }
            }
        })
        
        player.start(flow: .asyncNodeJson, completion: { _ in})
        
        wait(for: [handlerExpectation, textExpectation], timeout: 5)
        
        XCTAssert(count == 2)
        XCTAssertEqual(expectedMultiNode1Text, "new node from the hook 1")
        
        var replacementResult = AsyncNodeHandlerType.singleNode(.concrete(context.evaluateScript("""
                (
                    {"asset": {"id": "text", "type": "text", "value":"new node from the hook 2"}}
                )
            """) ?? JSValue()))
        
        args = replacementResult.handlerTypeToJSValue(context: context ?? JSContext())
        
        let _ = callbackFunction?.call(withArguments: [args])
        
        XCTAssert(count == 3)
        XCTAssertEqual(expectedMultiNode2Text, "new node from the hook 2")
        
        
        wait(for: [textExpectation2], timeout: 5)
        
        replacementResult = AsyncNodeHandlerType.emptyNode
        
        args = replacementResult.handlerTypeToJSValue(context: context ?? JSContext())
        
        _ = callbackFunction?.call(withArguments: [args])
        
        XCTAssert(count == 4)
        // asset that the value at index 0 for the object
        XCTAssertEqual(expectedMultiNode3Text, "test")
        XCTAssertEqual(expectedMultiNode4Text, "undefined")
    }
    
    func testChatMessageReplaceAsyncNodeWithProvidedNode() {
       let handlerExpectation = XCTestExpectation(description: "first data did not change")
       
       let context = JSContext()
       var count = 0
       
       let resolve: AsyncHookHandler = { _,_ in
           handlerExpectation.fulfill()
           
           if count == 1 {
               return .singleNode(ReplacementNode.encodable(
                   AssetPlaceholderNode(asset: PlaceholderNode(id: "text", type: "text", value: "new node"))
               ))
           }
           
           return .singleNode(ReplacementNode.concrete(context?.evaluateScript("") ?? JSValue()))
       }
       
       let asyncNodePluginPlugin = AsyncNodePluginPlugin()
       let plugin = AsyncNodePlugin(plugins: [asyncNodePluginPlugin], resolve)
       
       plugin.context = context
       
       XCTAssertNotNil(asyncNodePluginPlugin.context)

       let player = HeadlessPlayerImpl(plugins: [ReferenceAssetsPlugin(), plugin], context: context ?? JSContext())

       let textExpectation = XCTestExpectation(description: "newText found")
       
       var expectedNode1Text: String = ""
       
       player.hooks?.viewController.tap({ (viewController) in
           viewController.hooks.view.tap { (view) in
               view.hooks.onUpdate.tap { val in
                   count += 1
                   
                   if count == 2 {
                       let newText1 = val
                           .objectForKeyedSubscript("values")
                           .objectAtIndexedSubscript(1)
                           .objectForKeyedSubscript("asset")
                           .objectForKeyedSubscript("value")
                       guard let textString1 = newText1?.toString() else { return XCTFail("newText was not a string") }
                       
                       expectedNode1Text = textString1
                       textExpectation.fulfill()
                   }
               }
           }
       })
       
       player.start(flow: .chatMessageJson, completion: { _ in})
       
       wait(for: [handlerExpectation, textExpectation], timeout: 5)
       
       XCTAssert(count == 2)
       XCTAssertEqual(expectedNode1Text, "new node")
    }

    func testChatMessageReplaceAsyncNodeWithMultiNode() {
       let handlerExpectation = XCTestExpectation(description: "first data did not change")
       
       let context = JSContext()
       var count = 0
       
       let resolve: AsyncHookHandler = { _,_ in
           handlerExpectation.fulfill()
           
           if count == 1 {
               return .multiNode([
                    ReplacementNode.encodable(AssetPlaceholderNode(asset: PlaceholderNode(id: "text-1", type: "text", value: "1st value in the multinode"))),
                    ReplacementNode.encodable(AssetPlaceholderNode(asset: PlaceholderNode(id: "text-2", type: "text", value: "2nd value in the multinode"))),
                ])
           }
           
           return .singleNode(ReplacementNode.concrete(context?.evaluateScript("") ?? JSValue()))
       }
       
       let asyncNodePluginPlugin = AsyncNodePluginPlugin()
       let plugin = AsyncNodePlugin(plugins: [asyncNodePluginPlugin], resolve)
       
       plugin.context = context
       
       XCTAssertNotNil(asyncNodePluginPlugin.context)

       let player = HeadlessPlayerImpl(plugins: [ReferenceAssetsPlugin(), plugin], context: context ?? JSContext())
       
       let textExpectation = XCTestExpectation(description: "newText found")
       
       var expectedMultiNode1Text: String = ""
       var expectedMultiNode2Text: String = ""
       
       player.hooks?.viewController.tap({ (viewController) in
           viewController.hooks.view.tap { (view) in
               view.hooks.onUpdate.tap { val in
                   count += 1
                   
                   if count == 2 {
                       let newText1 = val
                           .objectForKeyedSubscript("values")
                           .objectAtIndexedSubscript(1)
                           .objectForKeyedSubscript("asset")
                           .objectForKeyedSubscript("value")
                       guard let textString1 = newText1?.toString() else { return XCTFail("newText was not a string") }
                       expectedMultiNode1Text = textString1

                       let newText2 = val
                           .objectForKeyedSubscript("values")
                           .objectAtIndexedSubscript(2)
                           .objectForKeyedSubscript("asset")
                           .objectForKeyedSubscript("value")
                       guard let textString2 = newText2?.toString() else { return XCTFail("newText was not a string") }
                       
                       expectedMultiNode2Text = textString2
                       textExpectation.fulfill()
                   }
               }
           }
       })
       
       player.start(flow: .chatMessageJson, completion: { _ in})
       
       wait(for: [handlerExpectation, textExpectation], timeout: 5)
       
       XCTAssert(count == 2)
       XCTAssertEqual(expectedMultiNode1Text, "1st value in the multinode")
       XCTAssertEqual(expectedMultiNode2Text, "2nd value in the multinode")
    }
    
    func testChatMessageReplaceAsyncNodeWithChatMessageAsset() {
        let handlerExpectation = XCTestExpectation(description: "first data did not change")
        
        let context = JSContext()
        var count = 0
        
        let resolve: AsyncHookHandler = { _,_ in
            handlerExpectation.fulfill()
            
            if count == 1 {
                return .singleNode(ReplacementNode.encodable(
                   AssetPlaceholderNode(asset: PlaceholderNode(id: "text", type: "chat-message", value: "chat message"))
               ))
            }
            
            return .singleNode(ReplacementNode.concrete(context?.evaluateScript("") ?? JSValue()))
        }
        
        let asyncNodePluginPlugin = AsyncNodePluginPlugin()
        let plugin = AsyncNodePlugin(plugins: [asyncNodePluginPlugin], resolve)
        
        plugin.context = context
        
        XCTAssertNotNil(asyncNodePluginPlugin.context)

        let player = HeadlessPlayerImpl(plugins: [ReferenceAssetsPlugin(), plugin], context: context ?? JSContext())
        
        let textExpectation = XCTestExpectation(description: "newText found")
        
        var expectedNode1Text: String = ""
        
        player.hooks?.viewController.tap({ (viewController) in
            viewController.hooks.view.tap { (view) in
                view.hooks.onUpdate.tap { val in
                    count += 1
                    
                    if count == 2 {
                        let newText1 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString1 = newText1?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedNode1Text = textString1
                        textExpectation.fulfill()
                    }
                }
            }
        })
        
        player.start(flow: .chatMessageJson, completion: { _ in})
        
        wait(for: [handlerExpectation, textExpectation], timeout: 5)
        
        XCTAssert(count == 2)
        XCTAssertEqual(expectedNode1Text, "chat message")
    }
    
    func testChatMessageReplaceAsyncNodeWithChainedChatMessageAsset() {
        let handlerExpectation = XCTestExpectation(description: "first data did not change")
        
        let context = JSContext()
        var count = 0
        
        let resolve: AsyncHookHandler = { _,_ in
            handlerExpectation.fulfill()
            
            if count == 1 {
                return .singleNode(ReplacementNode.encodable(
                   AssetPlaceholderNode(asset: PlaceholderNode(id: "chat", type: "chat-message", value: "chat message"))
               ))
            } else if count == 2 {
                return .singleNode(ReplacementNode.encodable(
                    AssetPlaceholderNode(asset: PlaceholderNode(id: "text", type: "text", value: "chained chat message"))
                ))
            }
            
            return .singleNode(ReplacementNode.concrete(context?.evaluateScript("") ?? JSValue()))
        }
        
        let asyncNodePluginPlugin = AsyncNodePluginPlugin()
        let plugin = AsyncNodePlugin(plugins: [asyncNodePluginPlugin], resolve)
        
        plugin.context = context
        
        XCTAssertNotNil(asyncNodePluginPlugin.context)

        let player = HeadlessPlayerImpl(plugins: [ReferenceAssetsPlugin(), plugin], context: context ?? JSContext())
        
        let textExpectation = XCTestExpectation(description: "newText found")
        let textExpectation2 = XCTestExpectation(description: "newText found")

        var expectedNode1Text: String = ""
        var expectedNode2Text: String = ""
        
        player.hooks?.viewController.tap({ (viewController) in
            viewController.hooks.view.tap { (view) in
                view.hooks.onUpdate.tap { val in
                    count += 1
                    
                    if count == 2 {
                        let newText1 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString1 = newText1?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedNode1Text = textString1
                        textExpectation.fulfill()
                    }
                    
                    if count == 3 {
                        let newText2 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(2)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString2 = newText2?.toString() else { return XCTFail("newText was not a string") }
                        
                        expectedNode2Text = textString2
                        textExpectation2.fulfill()
                    }
                }
            }
        })
        
        player.start(flow: .chatMessageJson, completion: { _ in})
        
        wait(for: [handlerExpectation, textExpectation], timeout: 5)
        
        XCTAssertEqual(expectedNode1Text, "chat message")

        wait(for: [textExpectation2], timeout: 5)
        XCTAssertEqual(expectedNode2Text, "chained chat message")
    }
}

extension String {
    static let asyncNodeJson = """
     {
       "id": "generated-flow",
       "views": [
         {
           "id": "collection",
           "type": "collection",
           "values": [
             {
               "asset": {
                 "id": "action",
                 "type": "action",
                 "exp": "{{count}} = {{count}} + 1",
                 "label": {
                   "asset": {
                     "id": "test",
                     "type": "text",
                     "value": "test"
                   }
                 }
               }
             },
             {
               "id": "async",
    
               "async": true
             }
           ]
         }
       ],
       "data": {
         "count": 0
       },
       "navigation": {
         "BEGIN": "FLOW_1",
         "FLOW_1": {
           "startState": "VIEW_1",
           "VIEW_1": {
             "state_type": "VIEW",
             "ref": "collection",
             "transitions": {
               "*": "END_Done"
             }
           },
           "END_Done": {
             "state_type": "END",
             "outcome": "done"
           }
         }
       }
     }
    """
}

extension String {
    static let chatMessageJson = """
     {
       "id": "generated-flow",
       "views": [
         {
            id: "1",
            type: "chat-message",
            value: "Hello World!",
          },
       ],
       "navigation": {
         "BEGIN": "FLOW_1",
         "FLOW_1": {
           "startState": "VIEW_1",
           "VIEW_1": {
             "state_type": "VIEW",
             "ref": "1",
             "transitions": {
               "*": "END_Done"
             }
           },
           "END_Done": {
             "state_type": "END",
             "outcome": "done"
           }
         }
       }
     }
    """
}

struct PlaceholderNode: Codable, Equatable, AssetData {
    public var id: String
    public var type: String
    var value: String?
    
    public init(id: String, type: String, value: String? = nil) {
        self.id = id
        self.type = type
        self.value = value
    }
}
