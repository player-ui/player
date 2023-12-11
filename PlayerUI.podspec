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

  s.subspec 'SwiftUI' do |swiftui|
    swiftui.dependency 'PlayerUI/Core'

    swiftui.source_files = 'ios/swiftui/Sources/**/*'
  end

  s.subspec 'Logger' do |pkg|
    pkg.dependency 'SwiftHooks', '~> 0', '>= 0.1.0'
    pkg.source_files = 'ios/logger/Sources/**/*'
  end
  # </PACKAGES>

  # <PLUGINS>
  s.subspec 'PrintLoggerPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'plugins/console-logger/ios/Sources/**/*'
  end

  s.subspec 'TransitionPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.dependency 'PlayerUI/SwiftUI'
    plugin.source_files = 'plugins/transition/swiftui/Sources/**/*'
  end

  s.subspec 'BaseBeaconPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'plugins/beacon/ios/Sources/**/*'
    plugin.resource_bundles = {
      'BaseBeaconPlugin' => ['plugins/beacon/ios/Resources/**/*.js']
    }
  end

  s.subspec 'BeaconPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.dependency 'PlayerUI/SwiftUI'
    plugin.dependency 'PlayerUI/BaseBeaconPlugin'
    plugin.source_files = 'plugins/beacon/swiftui/Sources/**/*'
  end

  s.subspec 'CheckPathPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'plugins/check-path/ios/Sources/**/*'
    plugin.resource_bundles = {
      'CheckPathPlugin' => ['plugins/check-path/ios/Resources/**/*.js']
    }
  end

  s.subspec 'CommonTypesPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'plugins/common-types/ios/Sources/**/*'
    plugin.resource_bundles = {
      'CommonTypesPlugin' => ['plugins/common-types/ios/Resources/**/*.js']
    }
  end

  s.subspec 'ComputedPropertiesPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'plugins/computed-properties/ios/Sources/**/*'
    plugin.resource_bundles = {
      'ComputedPropertiesPlugin' => ['plugins/computed-properties/ios/Resources/**/*.js']
    }
  end

  s.subspec 'CommonExpressionsPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'plugins/common-expressions/ios/Sources/**/*'
    plugin.resource_bundles = {
      'CommonExpressionsPlugin' => ['plugins/common-expressions/ios/Resources/**/*.js']
    }
  end

  s.subspec 'ExpressionPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'plugins/expression/ios/Sources/**/*'
    plugin.resource_bundles = {
      'ExpressionPlugin' => ['plugins/expression/ios/Resources/**/*.js']
    }
  end

  s.subspec 'ExternalActionPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'plugins/external-action/ios/Sources/**/*'
    plugin.resource_bundles = {
      'ExternalActionPlugin' => ['plugins/external-action/ios/Resources/**/*.js']
    }
  end

  s.subspec 'ExternalActionViewModifierPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.dependency 'PlayerUI/SwiftUI'
    plugin.dependency 'PlayerUI/ExternalActionPlugin'
    plugin.source_files = 'plugins/external-action/swiftui/Sources/**/*'
  end

  s.subspec 'MetricsPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.dependency 'PlayerUI/SwiftUI'
    plugin.source_files = 'plugins/metrics/swiftui/Sources/**/*'
    plugin.resource_bundles = {
      'MetricsPlugin' => ['plugins/metrics/swiftui/Resources/**/*.js']
    }
  end

  s.subspec 'PubSubPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'plugins/pubsub/ios/Sources/**/*'
    plugin.resource_bundles = {
      'PubSubPlugin' => ['plugins/pubsub/ios/Resources/**/*.js']
    }
  end

  s.subspec 'StageRevertDataPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'plugins/stage-revert-data/ios/Sources/**/*'
    plugin.resource_bundles = {
      'StageRevertDataPlugin' => ['plugins/stage-revert-data/ios/Resources/**/*.js']
    }
  end

  s.subspec 'SwiftUICheckPathPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.dependency 'PlayerUI/SwiftUI'
    plugin.dependency 'PlayerUI/CheckPathPlugin'
    plugin.source_files = 'plugins/check-path/swiftui/Sources/**/*'
  end

  s.subspec 'SwiftUIPendingTransactionPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.dependency 'PlayerUI/SwiftUI'
    plugin.source_files = 'plugins/pending-transaction/swiftui/Sources/**/*'
  end

  s.subspec 'TypesProviderPlugin' do |plugin|
    plugin.dependency 'PlayerUI/Core'
    plugin.source_files = 'plugins/types-provider/ios/Sources/**/*'
    plugin.resource_bundles = {
      'TypesProviderPlugin' => ['plugins/types-provider/ios/Resources/**/*.js']
    }
  end
  # </PLUGINS>
end
