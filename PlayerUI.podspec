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

  # <PACKAGES>
  s.subspec 'Core' do |core|
    core.source_files = 'ios/core/Sources/**/*'
    core.dependency 'SwiftHooks', '~> 0', '>= 0.1.0'
    core.dependency 'PlayerUI/Logger'
    core.resource_bundles = {
      'PlayerUI' => ['ios/core/Resources/**/*.js']
    }
  end

  s.subspec 'SwiftUI' do |swiftui|
    swiftui.dependency 'PlayerUI/Core'

    swiftui.source_files = 'ios/swiftui/Sources/**/*'
  end

  s.subspec 'Logger' do |pkg|
    pkg.dependency 'SwiftHooks', '~> 0', '>= 0.1.0'
    pkg.source_files = 'ios/logger/Sources/**/*'
  end

  s.subspec 'ReferenceAssets' do |assets|
    assets.dependency 'PlayerUI/Core'
    assets.dependency 'PlayerUI/SwiftUI'
    assets.dependency 'PlayerUI/BeaconPlugin'
    assets.dependency 'PlayerUI/SwiftUIPendingTransactionPlugin'

    assets.source_files = 'plugins/reference-assets/swiftui/Sources/**/*'
    assets.resource_bundles = {
      'ReferenceAssets' => [
        'plugins/reference-assets/swiftui/Resources/js/**/*.js',
        'plugins/reference-assets/swiftui/Resources/svg/*.xcassets',
        'plugins/reference-assets/swiftui/Resources/svg/*.xcassets/**/*'
      ]
    }
  end

  s.subspec 'TestUtilitiesCore' do |utils|
    utils.dependency 'PlayerUI/Core'
    utils.dependency 'PlayerUI/SwiftUI'

    utils.source_files = 'ios/test-utils-core/Sources/**/*'
    utils.resource_bundles = {
      'TestUtilities' => ['ios/test-utils-core/Resources/**/*.js']
    }
  end

  s.subspec 'TestUtilities' do |utils|
    utils.dependency 'PlayerUI/Core'
    utils.dependency 'PlayerUI/SwiftUI'
    utils.dependency 'PlayerUI/TestUtilitiesCore'

    utils.source_files = 'ios/test-utils/Sources/**/*'

    utils.weak_framework = 'XCTest'
    utils.pod_target_xcconfig = {
      'ENABLE_BITCODE' => 'NO',
      'ENABLE_TESTING_SEARCH_PATHS' => 'YES'
    }
  end
  # </PACKAGES>

  ios_plugin = lambda { |name, path, resources|
    s.subspec name do |subspec|
      subspec.dependency 'PlayerUI/Core'
      subspec.source_files = "plugins/#{path}/ios/Sources/**/*"
      if resources == TRUE
        subspec.resource_bundles = {
          name => ["plugins/#{path}/ios/Resources/**/*.js"]
        }
      end
    end
  }

  swiftui_plugin = lambda { |name, path, deps, resources|
    s.subspec name do |subspec|
      subspec.dependency 'PlayerUI/Core'
      subspec.dependency 'PlayerUI/SwiftUI'
      deps.each { |dep|
        subspec.dependency "PlayerUI/#{dep}"
      }
      subspec.source_files = "plugins/#{path}/swiftui/Sources/**/*"
      if resources == TRUE
        subspec.resource_bundles = {
          name => ["plugins/#{path}/swiftui/Resources/**/*.js"]
        }
      end
    end
  }

  # <PLUGINS>
  ios_plugin.call("BaseBeaconPlugin", "beacon", TRUE)
  ios_plugin.call("CheckPathPlugin", "check-path", TRUE)
  ios_plugin.call("CommonExpressionsPlugin", "common-expressions", TRUE)
  ios_plugin.call("CommonTypesPlugin", "common-types", TRUE)
  ios_plugin.call("ComputedPropertiesPlugin", "computed-properties", TRUE)
  ios_plugin.call("ExpressionPlugin", "expression", TRUE)
  ios_plugin.call("ExternalActionPlugin", "external-action", TRUE)
  ios_plugin.call("PubSubPlugin", "pubsub", TRUE)
  ios_plugin.call("StageRevertDataPlugin", "stage-revert-data", TRUE)
  ios_plugin.call("TypesProviderPlugin", "types-provider", TRUE)
  ios_plugin.call("PrintLoggerPlugin", "console-logger", FALSE)

  swiftui_plugin.call("BeaconPlugin", "beacon", ["BaseBeaconPlugin"], FALSE)
  swiftui_plugin.call("MetricsPlugin", "metrics", [], TRUE)
  swiftui_plugin.call("SwiftUICheckPathPlugin", "check-path", ["CheckPathPlugin"], FALSE)
  swiftui_plugin.call("ExternalActionViewModifierPlugin", "external-action", ["ExternalActionPlugin"], FALSE)
  swiftui_plugin.call("SwiftUIPendingTransactionPlugin", "pending-transaction", [], FALSE)
  swiftui_plugin.call("TransitionPlugin", "transition", [], FALSE)
  # </PLUGINS>
end
