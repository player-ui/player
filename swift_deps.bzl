load("@rules_swift_package_manager//swiftpkg:defs.bzl", "swift_package")

def swift_dependencies():
    # version: 4.6.1
    swift_package(
        name = "swiftpkg_aexml",
        commit = "38f7d00b23ecd891e1ee656fa6aeebd6ba04ecc3",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/tadija/AEXML.git",
    )

    # version: 0.2.0
    swift_package(
        name = "swiftpkg_collectionconcurrencykit",
        commit = "b4f23e24b5a1bff301efc5e70871083ca029ff95",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/JohnSundell/CollectionConcurrencyKit.git",
    )

    # version: 1.8.2
    swift_package(
        name = "swiftpkg_cryptoswift",
        commit = "c9c3df6ab812de32bae61fc0cd1bf6d45170ebf0",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/krzyzanowskim/CryptoSwift.git",
    )

    # version: 8.9.1
    swift_package(
        name = "swiftpkg_eyes_xcui_swift_package",
        commit = "8e968bc753f298bdc8836dae95ef8862bb6fa4bc",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/applitools/eyes-xcui-swift-package.git",
    )

    # version: 0.2.0
    swift_package(
        name = "swiftpkg_graphviz",
        commit = "70bebcf4597b9ce33e19816d6bbd4ba9b7bdf038",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/SwiftDocOrg/GraphViz.git",
    )

    # version: 4.2.0
    swift_package(
        name = "swiftpkg_jsonutilities",
        commit = "128d2ffc22467f69569ef8ff971683e2393191a0",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/yonaskolb/JSONUtilities.git",
    )

    # version: 1.0.1
    swift_package(
        name = "swiftpkg_pathkit",
        commit = "3bfd2737b700b9a36565a8c94f4ad2b050a5e574",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/kylef/PathKit.git",
    )

    # version: 3.2.0
    swift_package(
        name = "swiftpkg_rainbow",
        commit = "626c3d4b6b55354b4af3aa309f998fae9b31a3d9",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/onevcat/Rainbow.git",
    )

    # version: 0.34.1
    swift_package(
        name = "swiftpkg_sourcekitten",
        commit = "b6dc09ee51dfb0c66e042d2328c017483a1a5d56",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/jpsim/SourceKitten.git",
    )

    # version: 0.10.1
    swift_package(
        name = "swiftpkg_spectre",
        commit = "26cc5e9ae0947092c7139ef7ba612e34646086c7",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/kylef/Spectre.git",
    )

    # version: 1.2.3
    swift_package(
        name = "swiftpkg_swift_argument_parser",
        commit = "8f4d2753f0e4778c76d5f05ad16c74f707390531",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/apple/swift-argument-parser.git",
    )

    # version: 0.1.0
    swift_package(
        name = "swiftpkg_swift_hooks",
        commit = "5f3136ac2a3c27aa469e3f9a1222b15080d431d3",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/intuit/swift-hooks.git",
    )

    # version: 509.0.2
    swift_package(
        name = "swiftpkg_swift_syntax",
        commit = "6ad4ea24b01559dde0773e3d091f1b9e36175036",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/apple/swift-syntax.git",
    )

    # version: 6.0.3
    swift_package(
        name = "swiftpkg_swiftcli",
        commit = "2e949055d9797c1a6bddcda0e58dada16cc8e970",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/jakeheis/SwiftCLI.git",
    )

    # version: 0.54.0
    swift_package(
        name = "swiftpkg_swiftlint",
        commit = "f17a4f9dfb6a6afb0408426354e4180daaf49cee",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/realm/SwiftLint.git",
    )

    # version: 0.9.0
    swift_package(
        name = "swiftpkg_swiftytexttable",
        commit = "c6df6cf533d120716bff38f8ff9885e1ce2a4ac3",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/scottrhoyt/SwiftyTextTable.git",
    )

    # version: 7.0.2
    swift_package(
        name = "swiftpkg_swxmlhash",
        commit = "a853604c9e9a83ad9954c7e3d2a565273982471f",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/drmohundro/SWXMLHash.git",
    )

    # version: 2.0.1
    swift_package(
        name = "swiftpkg_version",
        commit = "1fe824b80d89201652e7eca7c9252269a1d85e25",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/mxcl/Version",
    )

    # version: 0.9.8
    swift_package(
        name = "swiftpkg_viewinspector",
        commit = "788e7879d38a839c4e348ab0762dcc0364e646a2",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/nalexn/ViewInspector",
    )

    # version: 2.38.0
    swift_package(
        name = "swiftpkg_xcodegen",
        commit = "87a275fb0852bb231550e66473804de57063c957",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/yonaskolb/XcodeGen.git",
    )

    # version: 8.16.0
    swift_package(
        name = "swiftpkg_xcodeproj",
        commit = "447c159b0c5fb047a024fd8d942d4a76cf47dde0",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/tuist/XcodeProj.git",
    )

    # version: 5.0.6
    swift_package(
        name = "swiftpkg_yams",
        commit = "9234124cff5e22e178988c18d8b95a8ae8007f76",
        dependencies_index = "@//:swift_deps_index.json",
        remote = "https://github.com/jpsim/Yams.git",
    )
