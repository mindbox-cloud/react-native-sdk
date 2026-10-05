require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "MindboxSdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "12.0" }
  s.source       = { :git => "https://github.com/mindbox-moscow/react-native-sdk/.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  s.dependency "Mindbox", "2.16.0-rc"
  s.dependency "MindboxNotifications", "2.16.0-rc"

  # The embedded block is a native component, and on the new renderer that means a Fabric component:
  # this brings in the renderer's own pods and, the part that decides everything, defines
  # `RCT_NEW_ARCH_ENABLED` for our sources — what `MindboxEmbeddedBlockView.mm` splits on. React
  # Native defines it for a library's own pod only through this call and nowhere else, so without it
  # the file compiles its old-renderer half even on a React Native that no longer has one.
  #
  # On the old renderer the same call settles for React-Core and leaves the flag undefined, which is
  # how the other half of that file gets compiled instead.
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end
