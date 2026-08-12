// swift-tools-version: 6.0
// Swift Package Manager manifest for React Native's experimental SwiftPM
// integration (RN 0.87+, `npx react-native spm`). CocoaPods consumers keep
// using MindboxSdk.podspec; both integrations coexist during the transition.
//
// The RN autolinker resolves this manifest through its
// build/generated/autolinking/libs/MindboxSdk symlink, so the relative
// ReactNative path below is stable for every consuming app.
//
// Sources are split into two targets because SwiftPM cannot compile mixed
// Swift + Objective-C sources in one target. The ObjC target is
// self-contained: RCT_EXTERN_MODULE forward-declares the Swift class and
// attaches a category, resolved at app link time.

import PackageDescription

let package = Package(
    name: "MindboxSdk",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "MindboxSdk", targets: ["MindboxSdk", "MindboxSdkObjC"])
    ],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(url: "https://github.com/mindbox-cloud/ios-sdk", from: "2.15.1"),
    ],
    targets: [
        .target(
            name: "MindboxSdkObjC",
            dependencies: [
                .product(name: "ReactHeaders", package: "ReactNative"),
                .product(name: "ReactNativeHeaders", package: "ReactNative"),
                .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
            ],
            path: ".",
            sources: ["MindboxSdk.m", "MindboxJsDelivery.m"],
            publicHeadersPath: ".",
            cSettings: [.headerSearchPath(".")],
            linkerSettings: [
                .linkedFramework("Foundation"),
                .linkedFramework("UIKit"),
                .linkedFramework("UserNotifications"),
            ]
        ),
        .target(
            name: "MindboxSdk",
            dependencies: [
                "MindboxSdkObjC",
                .product(name: "Mindbox", package: "ios-sdk"),
                .product(name: "ReactHeaders", package: "ReactNative"),
                .product(name: "ReactNativeHeaders", package: "ReactNative"),
                .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
            ],
            path: ".",
            sources: [
                "MindboxSdk.swift",
                "MindboxJsDeliveryBridge.swift",
                "InappDelegates/InappDelegates.swift",
            ]
        ),
    ]
)
