import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/**
 Validation payload attached to an input asset by the transform. Mirrors the JS
 `ValidationResponse` shape. Kept local so the A2UI module does not depend on the
 reference-assets module.
 */
public struct A2UIValidationData: Decodable, Equatable {
    public let message: String
    public let severity: String?
}

/// Maps an A2UI cross-axis `align` value to a SwiftUI `HorizontalAlignment` (for Column/List).
func a2uiHorizontalAlignment(_ align: String?) -> HorizontalAlignment {
    switch align {
    case "center": return .center
    case "end": return .trailing
    default: return .leading
    }
}

/// Maps an A2UI cross-axis `align` value to a SwiftUI `VerticalAlignment` (for Row).
func a2uiVerticalAlignment(_ align: String?) -> VerticalAlignment {
    switch align {
    case "center": return .center
    case "end": return .bottom
    default: return .top
    }
}
