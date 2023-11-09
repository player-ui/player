# Be sure to run `pod lib lint PlayerUI.podspec' to ensure this is a
# valid spec before submitting.
#
# Any lines starting with a # are optional, but their use is encouraged
# To learn more about a Podspec see https://guides.cocoapods.org/syntax/podspec.html
#

Pod::Spec.new do |s|
  s.name             = 'PlayerUI'
  s.version          = '0.0.1-placeholder'
  s.summary          = 'A native renderer for Player content'
  s.swift_versions   = ['5.1']
  s.description      = <<-DESC
This package is used to process semantic JSON in the Player format
and display it as a SwiftUI view comprised of registered assets.
                       DESC

  s.homepage         = 'https://github.com/player-ui/player'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'hborawski' => 'harris_borawski@intuit.com' }
  s.source         = { :http => "https://github.com/player-ui/player/releases/download/#{s.version.to_s}/PlayerUI_Pod.zip" }

  s.ios.deployment_target = '14.0'

  s.default_subspec = 'Main'

  s.subspec 'Main' do |all|
    all.dependency 'PlayerUI/SwiftUI'
  end

  # <INTERNAL>
  s.app_spec 'Demo' do |demo|
    demo.source_files = 'ios/packages/demo/Sources/**/*'

    demo.resources = [
      'ios/packages/demo/Resources/Primary.storyboard',
      'ios/packages/demo/Resources/Launch.xib',
      'ios/packages/demo/Resources/**/*.xcassets'
    ]

    demo.dependency 'PlayerUI/SwiftUI'
    demo.dependency 'PlayerUI/BeaconPlugin'
    demo.dependency 'PlayerUI/ReferenceAssets'
    demo.dependency 'PlayerUI/MetricsPlugin'
    demo.dependency 'PlayerUI/TransitionPlugin'

    demo.info_plist = {
      'UILaunchStoryboardName' => 'Launch',
      'CFBundleIdentifier' => 'com.intuit.ios.player',
      'UIApplicationSceneManifest' => {
        'UIApplicationSupportsMultipleScenes' => true,
        'UISceneConfigurations' => {
          'UIWindowSceneSessionRoleApplication' => [
            {
              'UISceneConfigurationName' => 'Default Configuration',
              'UISceneDelegateClassName' => 'PlayerUI_Demo.SceneDelegate'
            }
          ]
        }
      }
    }

    demo.pod_target_xcconfig = {
      'PRODUCT_BUNDLE_IDENTIFIER': 'com.intuit.ios.player',

      'CODE_SIGN_STYLE': 'Manual',
      'CODE_SIGN_IDENTITY': 'iPhone Distribution',
      'PROVISIONING_PROFILE_SPECIFIER': 'match InHouse com.intuit.ios.player',
      'DEVELOPMENT_TEAM': 'F6DWWXWEX6',

      'SKIP_INSTALL': 'NO',
      'SKIP_INSTALLED_PRODUCT': 'YES'
    }

    demo.script_phases = [
        {
          :name => 'SwiftLint',
          :execution_position => :before_compile,
          :script => <<-SCRIPT
            cd ${SRCROOT}/../..
            ${PODS_ROOT}/SwiftLint/swiftlint --config .swiftlint.yml --path ./ios/
          SCRIPT
        },
        {
        :name => 'Mock Generation',
        :execution_position => :before_compile,
        :shell_path => '/bin/zsh',
        :script => <<-SCRIPT
          cd ${SRCROOT}/../../ios/packages/demo/scripts
          if test -f ~/.zshrc; then
            source ~/.zshrc
          fi
          ./generateFlowSections.js
        SCRIPT
      }
    ]
  end

  s.subspec 'InternalUnitTestUtilities' do |utils|
    utils.dependency 'PlayerUI/Core'
    utils.source_files = 'ios/packages/internal-test-utils/Sources/**/*'

    utils.weak_framework = 'XCTest'
    utils.pod_target_xcconfig = {
      'ENABLE_BITCODE' => 'NO',
      'ENABLE_TESTING_SEARCH_PATHS' => 'YES'
    }
  end

  s.test_spec 'Unit' do |tests|
    tests.requires_app_host = true
    tests.app_host_name = 'PlayerUI/Demo'
    tests.dependency 'PlayerUI/InternalUnitTestUtilities'
    tests.dependency 'PlayerUI/Demo'
    tests.dependency 'PlayerUI/TestUtilities'
    tests.source_files = [
      'ios/packages/*/Tests/**/*.swift',
      'ios/plugins/*/Tests/**/*.swift'
    ]
  end

  s.test_spec 'ViewInspectorTests' do |tests|
    tests.test_type = :ui
    tests.requires_app_host = true
    tests.app_host_name = 'PlayerUI/Demo'
    tests.dependency 'PlayerUI/InternalUnitTestUtilities'
    tests.dependency 'PlayerUI/Demo'
    tests.dependency 'ViewInspector', '0.9.0'
    tests.source_files = [
      'ios/packages/*/ViewInspector/**/*',
      'ios/plugins/*/ViewInspector/**/*',

      # Mocks from demo app
      'ios/packages/demo/Sources/MockFlows.swift'
    ]
    # tests.resources = ['ios/packages/test-utils/viewinspector/ui-test/mocks']

    tests.pod_target_xcconfig = {
      'PRODUCT_BUNDLE_IDENTIFIER': 'com.intuit.ios.PlayerUI-ExampleUITests',

      'CODE_SIGN_STYLE': 'Manual',
      'CODE_SIGN_IDENTITY[sdk=iphoneos*]': 'iPhone Developer',
      'PROVISIONING_PROFILE_SPECIFIER': 'match Development com.intuit.ios.PlayerUI-ExampleUITests*',
      'DEVELOPMENT_TEAM': 'F6DWWXWEX6'
    }
  end

  s.test_spec 'XCUITests' do |tests|
    tests.test_type = :ui
    tests.requires_app_host = true
    tests.app_host_name = 'PlayerUI/Demo'
    tests.dependency 'PlayerUI/InternalUnitTestUtilities'
    tests.dependency 'PlayerUI/Demo'
    tests.dependency 'EyesXCUI', '8.8.8'
    tests.source_files = [
      'ios/packages/*/UITests/**/*',
      'ios/plugins/*/UITests/**/*'
    ]

    tests.pod_target_xcconfig = {
      'PRODUCT_BUNDLE_IDENTIFIER': 'com.intuit.ios.PlayerUI-ExampleUITests',

      'CODE_SIGN_STYLE': 'Manual',
      'CODE_SIGN_IDENTITY[sdk=iphoneos*]': 'iPhone Developer',
      'PROVISIONING_PROFILE_SPECIFIER': 'match Development com.intuit.ios.PlayerUI-ExampleUITests*',
      'DEVELOPMENT_TEAM': 'F6DWWXWEX6'
    }
  end

  # </INTERNAL>

  # <PACKAGES>
  s.subspec 'Core' do |core|
    core.source_files = 'ios/packages/core/Sources/**/*'
    core.dependency 'SwiftHooks', '~> 0', '>= 0.1.0'
    core.dependency 'PlayerUI/Logger'
    core.resource_bundles = {
      'PlayerUI' => ['ios/packages/core/Resources/**/*.js']
    }
  end

  s.subspec 'TestUtilitiesCore' do |utils|
    utils.dependency 'PlayerUI/Core'
    utils.dependency 'PlayerUI/SwiftUI'

    utils.source_files = 'ios/packages/test-utils-core/Sources/**/*'
    utils.resource_bundles = {
      'TestUtilities' => ['ios/packages/test-utils/Resources/**/*.js']
    }
  end

  s.subspec 'TestUtilities' do |utils|
    utils.dependency 'PlayerUI/Core'
    utils.dependency 'PlayerUI/SwiftUI'
    utils.dependency 'PlayerUI/TestUtilitiesCore'

    utils.source_files = 'ios/packages/test-utils/Sources/**/*'

    utils.weak_framework = 'XCTest'
    utils.pod_target_xcconfig = {
      'ENABLE_BITCODE' => 'NO',
      'ENABLE_TESTING_SEARCH_PATHS' => 'YES'
    }
  end

  s.subspec 'ReferenceAssets' do |assets|
    assets.dependency 'PlayerUI/Core'
    assets.dependency 'PlayerUI/SwiftUI'
    assets.dependency 'PlayerUI/BeaconPlugin'

    assets.source_files = 'ios/packages/reference-assets/Sources/**/*'
    assets.resource_bundles = {
      'ReferenceAssets' => [
        'ios/packages/reference-assets/Resources/js/**/*.js',
        'ios/packages/reference-assets/Resources/svg/*.xcassets',

        # This should be generated by cocoapods-bazel in the build file, but isn't for some reason
        'ios/packages/reference-assets/Resources/svg/*.xcassets/**/*'
      ]
    }
  end

  s.subspec 'SwiftUI' do |swiftui|
    swiftui.dependency 'PlayerUI/Core'

    swiftui.source_files = 'ios/packages/swiftui/Sources/**/*'
  end

  s.subspec 'Logger' do |pkg|
    pkg.dependency 'SwiftHooks', '~> 0', '>= 0.1.0'
    pkg.source_files = 'ios/packages/logger/Sources/**/*'
  end
  # </PACKAGES>

  # <PLUGINS>
  s.subspec 'PrintLoggerPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'ios/plugins/PrintLoggerPlugin/Sources/**/*'
  end

  s.subspec 'TransitionPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.dependency 'PlayerUI/SwiftUI'
    plugin.source_files = 'ios/plugins/TransitionPlugin/Sources/**/*'
  end

  s.subspec 'BaseBeaconPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'ios/plugins/BaseBeaconPlugin/Sources/**/*'
    plugin.resource_bundles = {
      'BaseBeaconPlugin' => ['ios/plugins/BaseBeaconPlugin/Resources/**/*.js']
    }
  end

  s.subspec 'BeaconPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.dependency 'PlayerUI/SwiftUI'
    plugin.dependency 'PlayerUI/BaseBeaconPlugin'
    plugin.source_files = 'ios/plugins/BeaconPlugin/Sources/**/*'
  end

  s.subspec 'CheckPathPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'ios/plugins/CheckPathPlugin/Sources/**/*'
    plugin.resource_bundles = {
      'CheckPathPlugin' => ['ios/plugins/CheckPathPlugin/Resources/**/*.js']
    }
  end

  s.subspec 'CommonTypesPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'ios/plugins/CommonTypesPlugin/Sources/**/*'
    plugin.resource_bundles = {
      'CommonTypesPlugin' => ['ios/plugins/CommonTypesPlugin/Resources/**/*.js']
    }
  end

  s.subspec 'CommonExpressionsPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'ios/plugins/CommonExpressionsPlugin/Sources/**/*'
    plugin.resource_bundles = {
      'CommonExpressionsPlugin' => ['ios/plugins/CommonExpressionsPlugin/Resources/**/*.js']
    }
  end

  s.subspec 'ExpressionPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'ios/plugins/ExpressionPlugin/Sources/**/*'
    plugin.resource_bundles = {
      'ExpressionPlugin' => ['ios/plugins/ExpressionPlugin/Resources/**/*.js']
    }
  end

  s.subspec 'ExternalActionPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'ios/plugins/ExternalActionPlugin/Sources/**/*'
    plugin.resource_bundles = {
      'ExternalActionPlugin' => ['ios/plugins/ExternalActionPlugin/Resources/**/*.js']
    }
  end

  s.subspec 'ExternalActionViewModifierPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.dependency 'PlayerUI/SwiftUI'
    plugin.dependency 'PlayerUI/ExternalActionPlugin'
    plugin.source_files = 'ios/plugins/ExternalActionViewModifierPlugin/Sources/**/*'
  end

  s.subspec 'MetricsPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.dependency 'PlayerUI/SwiftUI'
    plugin.source_files = 'ios/plugins/MetricsPlugin/Sources/**/*'
    plugin.resource_bundles = {
      'MetricsPlugin' => ['ios/plugins/MetricsPlugin/Resources/**/*.js']
    }
  end

  s.subspec 'PubSubPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'ios/plugins/PubSubPlugin/Sources/**/*'
    plugin.resource_bundles = {
      'PubSubPlugin' => ['ios/plugins/PubSubPlugin/Resources/**/*.js']
    }
  end

  s.subspec 'StageRevertDataPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'ios/plugins/StageRevertDataPlugin/Sources/**/*'
    plugin.resource_bundles = {
      'StageRevertDataPlugin' => ['ios/plugins/StageRevertDataPlugin/Resources/**/*.js']
    }
  end

  s.subspec 'SwiftUICheckPathPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.dependency 'PlayerUI/SwiftUI'
    plugin.dependency 'PlayerUI/CheckPathPlugin'
    plugin.source_files = 'ios/plugins/SwiftUICheckPathPlugin/Sources/**/*'
  end

  s.subspec 'TypesProviderPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'ios/plugins/TypesProviderPlugin/Sources/**/*'
    plugin.resource_bundles = {
      'TypesProviderPlugin' => ['ios/plugins/TypesProviderPlugin/Resources/**/*.js']
    }
  end
  # </PLUGINS>
end
