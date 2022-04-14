//
//  UIView+Extensions.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 4/2/20.
//
import Foundation
import UIKit

/**
 Convenience extensions for embedding views inside other views
 */
public extension UIView {

    /**
     Function to embed this view inside a view, with the given margins for constraints
     - parameters:
        - view: The view to embed
        - top: The top margin between the embedded view and this view's top edge
        - trailing: The trailing margin between the embedded view and this view's trailing edge
        - bottom: The bottom margin between the embedded view and this view's bottom edge
        - leading: The leading margin between the embedded view and this view's leading edge
     */
    func embedAt(_ view: UIView, _ top: CGFloat?, _ trailing: CGFloat?, _ bottom: CGFloat?, _ leading: CGFloat?) {
        view.addSubview(self)
        self.translatesAutoresizingMaskIntoConstraints = false
        if let top = top {
            self.topAnchor.constraint(equalTo: view.topAnchor, constant: top).isActive = true
        }
        if let trailing = trailing {
            self.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -trailing).isActive = true
        }
        if let bottom = bottom {
            self.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -bottom).isActive = true
        }
        if let leading = leading {
            self.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: leading).isActive = true
        }
    }

    /**
     Function to center embed this view next inside a view, either makes it the first subview
     or offsets it from the last subview
     - parameters:
        - view: The view to embed
        - top: The amount of space that should be above the embedded view
        - trailing: The amount of trailing space for the embedded view
        - leading: The amount of leading space for the embedded view
     */
    func embedIn(_ view: UIView, _ top: CGFloat, _ trailing: CGFloat?, _ leading: CGFloat?) {
        let previous: UIView? = view.subviews.last
        view.addSubview(self)
        self.translatesAutoresizingMaskIntoConstraints = false

        // If there are other subviews, align after that one
        if let previousView = previous {
            self.topAnchor.constraint(equalTo: previousView.bottomAnchor, constant: top).isActive = true
            self.centerXAnchor.constraint(equalTo: previousView.centerXAnchor).isActive = true
        } else {
            self.topAnchor.constraint(equalTo: view.topAnchor, constant: top).isActive = true
            self.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        }
        if let trailing = trailing {
            self.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -trailing).isActive = true
        }
        if let leading = leading {
            self.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: leading).isActive = true
        }
    }

    /**
     Function to set an offset between the last subview and this view
     - parameters:
        - offset: How much to pad the space between the last subview and this view
     */
    func pinLast(offset: CGFloat = 8) {
        guard let last = subviews.last else { return }
        NSLayoutConstraint.activate([
            last.bottomAnchor.constraint(equalTo: self.bottomAnchor, constant: -offset)
        ])
    }

    /**
     Function to check if a string based keypath is applicable to this view
     - parameters:
        - keyPath: A dot-separated path to the value intended to set
     - returns: Boolean indicating if the path is valid for this view
     */
    func respondsTo(keyPath: String) -> Bool {
        var currentPart: NSObject = self
        let parts = keyPath.split(separator: ".")
        for part in parts {
            if
                currentPart.responds(to: NSSelectorFromString(String(part))),
                let newPart = currentPart.value(forKeyPath: String(part)) as? NSObject
            {
                currentPart = newPart
            } else {
                return false
            }
        }
        return true
    }

    /**
     The first responder in this hierarchy of views
     */
    var currentFirstResponder: UIView? {
        guard !isFirstResponder else { return self }
        for subview in subviews {
            if let firstResponder = subview.currentFirstResponder {
                return firstResponder
            }
        }
        return nil
    }

}
