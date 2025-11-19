//
//  ValidationView.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/4/21.
//

import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/**
 The severity of a validation object
 */
public enum ValidationSeverity: String, Decodable {
    /// The validation was an error
    case error

    /// The validation was a warning
    case warning
}

/**
 Extension for ValidationSeverity for associated colors and images with severity levels
 */
extension ValidationSeverity {
    /// The color of this severity
    public var color: Color {
        switch self {
        case .warning:
            return Color(red: 0.976, green: 0.341, blue: 0.000)
        default:
            return Color(red: 0.835, green: 0.169, blue: 0.118)
        }
    }

    /// The text color of this severity
    public var textColor: Color {
        switch self {
        case .warning:
            return Color(red: 0.000, green: 0.000, blue: 0.000)
        default:
            return Color(red: 0.835, green: 0.169, blue: 0.118)
        }
    }

    /// The icon of this severity
    public var icon: UIImage? {
        return InternalAssets.getSVGOfSize(
            name: self.rawValue,
            size: CGSize(width: 16, height: 16)
        )
    }
}

/**
 Decodable class that represents a validation object
 */
struct ValidationData: Decodable, Hashable {
    /// The severity of this validation
    public var severity: ValidationSeverity

    /// The message associated with this validation
    public var message: String

    /// A function to dismiss the validation if it's allowed
    public var dismiss: WrappedFunction<Void>?
}

/**
 Shows a validation message
 */
struct ValidationView: View {
    /// The message to show
    var message: String
    // The severity of the message
    var severity: ValidationSeverity
    /// A dismiss function if it should be dismissable
    var dismiss: (() -> Void)?

    @ViewBuilder
    var body: some View {
        HStack {
            Image(uiImage: severity.icon ?? UIImage()).foregroundColor(severity.color)
            Text(message).foregroundColor(severity.textColor).font(.system(size: 14)).italic().bold()
            if let dismissAction = dismiss {
                Spacer()
                Button("Dismiss", action: dismissAction).foregroundColor(.blue)
            }
        }
    }
}
