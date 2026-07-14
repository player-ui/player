// swiftlint:disable all
//
// A2UI demo snapshots.
//
// NOTE: iOS has no runtime mechanism to consume the canonical mock JSON the way
// JS (`@player-ui/a2ui-plugin-mocks`) and JVM/Android (`//tools/mocks:jar`) do —
// the demo/test convention on iOS is inline strings (see `MockFlows.swift`). These
// are faithful copies of the canonical source of truth at
// `plugins/a2ui/mocks/src/**/*.json`; keep them in sync when the canonical set changes.
//
public enum A2UIMockFlows {
    /// Every canonical A2UI snapshot (21), matching `plugins/a2ui/mocks/src`.
    public static let all: [(name: String, snapshot: String)] = [
        (name: "Button - basic", snapshot: buttonBasic),
        (name: "Button - with action", snapshot: buttonWithAction),
        (name: "Card - basic", snapshot: cardBasic),
        (name: "CheckBox - basic", snapshot: checkBoxBasic),
        (name: "ChoicePicker - single select", snapshot: choicePickerSingle),
        (name: "ChoicePicker - multi select", snapshot: choicePickerMulti),
        (name: "Column - basic", snapshot: columnBasic),
        (name: "DateTimeInput - basic", snapshot: dateTimeInputBasic),
        (name: "Divider - basic", snapshot: dividerBasic),
        (name: "Expressions - showcase", snapshot: expressionsShowcase),
        (name: "Icon - basic", snapshot: iconBasic),
        (name: "Image - basic", snapshot: imageBasic),
        (name: "List - basic", snapshot: listBasic),
        (name: "Modal - basic", snapshot: modalBasic),
        (name: "Row - basic", snapshot: rowBasic),
        (name: "Slider - basic", snapshot: sliderBasic),
        (name: "Tabs - basic", snapshot: tabsBasic),
        (name: "TextField - basic", snapshot: textFieldBasic),
        (name: "TextField - validation", snapshot: textFieldValidation),
        (name: "Text - basic", snapshot: textBasic),
        (name: "Text - variants", snapshot: textVariants),
    ]

    static let buttonBasic = """
    {
      "surfaceId": "button-basic",
      "components": [
        { "id": "root", "component": "Button", "child": "lbl", "variant": "primary" },
        { "id": "lbl", "component": "Text", "text": "Click me" }
      ]
    }
    """

    static let buttonWithAction = """
    {
      "surfaceId": "button-with-action",
      "components": [
        { "id": "root", "component": "Column", "children": ["hint", "btn"] },
        { "id": "hint", "component": "Text", "text": "Click the button to fire a 'submit' event." },
        { "id": "btn", "component": "Button", "child": "lbl", "variant": "primary", "action": { "event": { "name": "submit" } } },
        { "id": "lbl", "component": "Text", "text": "Submit" }
      ]
    }
    """

    static let cardBasic = """
    {
      "surfaceId": "card-basic",
      "components": [
        { "id": "root", "component": "Card", "child": "body" },
        { "id": "body", "component": "Column", "children": ["title", "para"] },
        { "id": "title", "component": "Text", "text": "Card Title", "variant": "h4" },
        { "id": "para", "component": "Text", "text": "This is a card body — a padded surface with elevation." }
      ]
    }
    """

    static let checkBoxBasic = """
    {
      "surfaceId": "check-box-basic",
      "data": { "prefs": { "newsletter": false } },
      "components": [
        { "id": "root", "component": "CheckBox", "label": "Subscribe to the newsletter", "value": { "path": "/prefs/newsletter" } }
      ]
    }
    """

    static let choicePickerSingle = """
    {
      "surfaceId": "choice-picker-single",
      "data": { "survey": { "color": [] } },
      "components": [
        {
          "id": "root",
          "component": "ChoicePicker",
          "selections": { "path": "/survey/color" },
          "maxAllowedSelections": 1,
          "options": [
            { "label": "Red", "value": "red" },
            { "label": "Green", "value": "green" },
            { "label": "Blue", "value": "blue" }
          ]
        }
      ]
    }
    """

    static let choicePickerMulti = """
    {
      "surfaceId": "choice-picker-multi",
      "data": { "survey": { "toppings": [] } },
      "components": [
        {
          "id": "root",
          "component": "ChoicePicker",
          "selections": { "path": "/survey/toppings" },
          "maxAllowedSelections": 3,
          "options": [
            { "label": "Cheese", "value": "cheese" },
            { "label": "Pepperoni", "value": "pepperoni" },
            { "label": "Mushrooms", "value": "mushrooms" },
            { "label": "Olives", "value": "olives" },
            { "label": "Onions", "value": "onions" }
          ]
        }
      ]
    }
    """

    static let columnBasic = """
    {
      "surfaceId": "column-basic",
      "components": [
        { "id": "root", "component": "Column", "children": ["a", "b", "c"], "align": "start" },
        { "id": "a", "component": "Text", "text": "First", "variant": "h3" },
        { "id": "b", "component": "Text", "text": "Second" },
        { "id": "c", "component": "Text", "text": "Third" }
      ]
    }
    """

    static let dateTimeInputBasic = """
    {
      "surfaceId": "date-time-input-basic",
      "data": { "event": { "startsAt": "" } },
      "components": [
        { "id": "root", "component": "DateTimeInput", "value": { "path": "/event/startsAt" }, "enableDate": true, "enableTime": true }
      ]
    }
    """

    static let dividerBasic = """
    {
      "surfaceId": "divider-basic",
      "components": [
        { "id": "root", "component": "Column", "children": ["top", "div", "bottom"] },
        { "id": "top", "component": "Text", "text": "Above" },
        { "id": "div", "component": "Divider", "axis": "horizontal" },
        { "id": "bottom", "component": "Text", "text": "Below" }
      ]
    }
    """

    static let expressionsShowcase = """
    {
      "surfaceId": "expressions-showcase",
      "data": {
        "user": { "name": "Ada", "email": "" },
        "order": { "subtotal": 1299.5 }
      },
      "components": [
        { "id": "root", "component": "Column", "children": ["greeting", "subtotal", "total", "emailField", "linkBtn"] },
        { "id": "greeting", "component": "Text", "variant": "h3", "text": { "call": "formatString", "args": { "value": "Hello, ${/user/name}!" } } },
        { "id": "subtotal", "component": "Text", "text": { "call": "formatString", "args": { "value": "Subtotal: ${/order/subtotal}" } } },
        { "id": "total", "component": "Text", "text": { "call": "formatCurrency", "args": { "value": { "path": "/order/subtotal" }, "currency": "USD", "locale": "en-US" } } },
        { "id": "emailField", "component": "TextField", "label": "Email", "value": { "path": "/user/email" }, "textFieldType": "shortText", "validationRegexp": "^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$" },
        { "id": "linkBtn", "component": "Button", "variant": "outline", "child": "linkLbl", "action": { "functionCall": { "call": "openUrl", "args": { "url": "https://a2ui.org", "target": "_blank" } } } },
        { "id": "linkLbl", "component": "Text", "text": "Open A2UI Spec" }
      ]
    }
    """

    static let iconBasic = """
    {
      "surfaceId": "icon-basic",
      "components": [
        { "id": "root", "component": "Row", "children": ["i1", "i2", "i3", "i4"] },
        { "id": "i1", "component": "Icon", "name": "check", "accessibility": "Check" },
        { "id": "i2", "component": "Icon", "name": "x", "accessibility": "Close" },
        { "id": "i3", "component": "Icon", "name": "search", "accessibility": "Search" },
        { "id": "i4", "component": "Icon", "name": "user", "accessibility": "User" }
      ]
    }
    """

    static let imageBasic = """
    {
      "surfaceId": "image-basic",
      "components": [
        { "id": "root", "component": "Image", "url": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=320", "fit": "cover", "variant": "rounded", "accessibility": "Decorative landscape" }
      ]
    }
    """

    static let listBasic = """
    {
      "surfaceId": "list-basic",
      "data": { "items": ["Apples", "Oranges", "Pears", "Bananas"] },
      "components": [
        { "id": "root", "component": "List", "direction": "vertical", "children": { "path": "/items", "componentId": "rowItem" } },
        { "id": "rowItem", "component": "Text", "text": { "path": "" } }
      ]
    }
    """

    static let modalBasic = """
    {
      "surfaceId": "modal-basic",
      "components": [
        { "id": "root", "component": "Modal", "entryPointChild": "openBtn", "contentChild": "body" },
        { "id": "openBtn", "component": "Button", "child": "openLbl", "variant": "primary" },
        { "id": "openLbl", "component": "Text", "text": "Open Modal" },
        { "id": "body", "component": "Column", "children": ["title", "para"] },
        { "id": "title", "component": "Text", "text": "Modal Title", "variant": "h4" },
        { "id": "para", "component": "Text", "text": "This is the modal body content." }
      ]
    }
    """

    static let rowBasic = """
    {
      "surfaceId": "row-basic",
      "components": [
        { "id": "root", "component": "Row", "children": ["t1", "t2", "t3"], "justify": "spaceBetween" },
        { "id": "t1", "component": "Text", "text": "Left" },
        { "id": "t2", "component": "Text", "text": "Middle" },
        { "id": "t3", "component": "Text", "text": "Right" }
      ]
    }
    """

    static let sliderBasic = """
    {
      "surfaceId": "slider-basic",
      "data": { "settings": { "volume": 50 } },
      "components": [
        { "id": "root", "component": "Slider", "value": { "path": "/settings/volume" }, "minValue": 0, "maxValue": 100, "accessibility": "Volume" }
      ]
    }
    """

    static let tabsBasic = """
    {
      "surfaceId": "tabs-basic",
      "components": [
        {
          "id": "root",
          "component": "Tabs",
          "tabItems": [
            { "title": "Overview", "child": "tab1" },
            { "title": "Details", "child": "tab2" },
            { "title": "Reviews", "child": "tab3" }
          ]
        },
        { "id": "tab1", "component": "Text", "text": "This is the overview pane." },
        { "id": "tab2", "component": "Text", "text": "Detailed information lives here." },
        { "id": "tab3", "component": "Text", "text": "Customer reviews appear here." }
      ]
    }
    """

    static let textFieldBasic = """
    {
      "surfaceId": "text-field-basic",
      "data": { "user": { "name": "" } },
      "components": [
        { "id": "root", "component": "TextField", "label": "Your name", "value": { "path": "/user/name" }, "textFieldType": "shortText" }
      ]
    }
    """

    static let textFieldValidation = """
    {
      "surfaceId": "text-field-validation",
      "data": { "user": { "email": "" } },
      "components": [
        { "id": "root", "component": "TextField", "label": "Email", "value": { "path": "/user/email" }, "textFieldType": "shortText", "validationRegexp": "^[^@\\\\s]+@[^@\\\\s]+\\\\.[^@\\\\s]+$" }
      ]
    }
    """

    static let textBasic = """
    {
      "surfaceId": "text-basic",
      "components": [
        { "id": "root", "component": "Text", "text": "Hello A2UI", "variant": "body" }
      ]
    }
    """

    static let textVariants = """
    {
      "surfaceId": "text-variants",
      "components": [
        { "id": "root", "component": "Column", "children": ["h1", "h2", "h3", "h4", "h5", "body", "caption"] },
        { "id": "h1", "component": "Text", "text": "Heading 1", "variant": "h1" },
        { "id": "h2", "component": "Text", "text": "Heading 2", "variant": "h2" },
        { "id": "h3", "component": "Text", "text": "Heading 3", "variant": "h3" },
        { "id": "h4", "component": "Text", "text": "Heading 4", "variant": "h4" },
        { "id": "h5", "component": "Text", "text": "Heading 5", "variant": "h5" },
        { "id": "body", "component": "Text", "text": "Body paragraph", "variant": "body" },
        { "id": "caption", "component": "Text", "text": "Smaller caption", "variant": "caption" }
      ]
    }
    """
}

// swiftlint:enable all
