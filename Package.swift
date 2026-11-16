// swift-tools-version: 6.0
import PackageDescription

let reactHeaders: [Target.Dependency] = [
    .product(name: "ReactHeaders", package: "ReactNative"),
    .product(name: "ReactNativeHeaders", package: "ReactNative"),
    .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
]

let package = Package(
    name: "MindboxSdk",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "MindboxSdk", targets: ["MindboxSdk", "MindboxSdkObjC"]),
    ],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
        .package(url: "https://github.com/mindbox-cloud/ios-sdk", exact: "2.16.0"),
    ],
    targets: [
        .target(
            name: "MindboxSdkObjC",
            dependencies: reactHeaders + [.product(name: "ReactAppHeaders", package: "React-GeneratedCode")],
            path: "ios/MindboxSdkObjC",
            cSettings: [
                .define("RCT_NEW_ARCH_ENABLED", to: "1"),
            ],
            cxxSettings: [
                .define("RCT_NEW_ARCH_ENABLED", to: "1"),
                .define("DEBUG", .when(configuration: .debug)),
                .define("NDEBUG", .when(configuration: .release)),
            ],
            linkerSettings: [.linkedFramework("UserNotifications")]
        ),
        .target(
            name: "MindboxSdk",
            dependencies: ["MindboxSdkObjC", .product(name: "Mindbox", package: "ios-sdk")] + reactHeaders,
            path: "ios/MindboxSdk",
            swiftSettings: [
                .define("RCT_NEW_ARCH_ENABLED"),
                .swiftLanguageMode(.v5),
            ]
        ),
    ],
    cxxLanguageStandard: .cxx20
)
