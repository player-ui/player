//
//  ResourceUtilities.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 3/13/20.
//

import Foundation

/**
 Utilities for loading resource files
 */
public class ResourceUtilities {
    /**
     Gets the URL for a file in the bundle
     Example:
     ```
     ResourceUtilities.urlForFile(name: "plugin", ext: "js", bundle: Bundle.module)
     ```

     - parameters:
        - name: The name of the file
        - ext: The extension of the file
        - bundle: The bundle to load URLs from
     - returns:
        A URL to the file if the bundle can be loaded
     */
    public static func urlForFile(name: String, ext: String, bundle: Bundle) -> URL? {
        guard let bundleURL = bundle.resourceURL else { return nil }
        return Bundle(url: bundleURL)?.url(forResource: name, withExtension: ext)
    }
}
