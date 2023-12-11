//
//  InternalAssets.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 3/13/20.
//

import Foundation
import UIKit

/**
 Assets that are used internally for rendering ReferenceAssets
 */
class InternalAssets {

    /**
     An image used for the dismiss button
     */
    static var dismissIcon: UIImage? {
        return InternalAssets.getSVGOfSize(name: "dismiss")
    }

    /**
     Helper method to get and resize bundled SVGs
     - parameters:
        - name: The name of the svg icon
        - size: The size to resize the SVG to if desired
     - returns: A resized UIImage from the SVG
     */
    static func getSVGOfSize(name: String, size: CGSize? = nil) -> UIImage? {
        guard
            let url = Bundle(for: InternalAssets.self).resourceURL?.appendingPathComponent("ReferenceAssets.bundle"),
            let bundle = Bundle(url: url) else { return nil }

        let image = UIImage(named: name, in: bundle, with: .none)

        if let size = size {
            return image?.resize(to: size).withRenderingMode(.alwaysTemplate)
        }

        return image?.withRenderingMode(.alwaysTemplate)
    }
}

extension UIImage {
    func resize(to newSize: CGSize) -> UIImage {
        let rect = CGRect(origin: CGPoint(x: 0, y: 0), size: newSize)
        UIGraphicsBeginImageContext(newSize)
        self.draw(in: rect)
        guard let newImage = UIGraphicsGetImageFromCurrentImageContext() else { return self }
        UIGraphicsEndImageContext()
        return newImage
    }
}
