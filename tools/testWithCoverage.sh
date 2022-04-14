git_root=$(git rev-parse --show-toplevel)

mkdir -p "$git_root/CoverageData"

rm "$git_root/CoverageData/"*

"bazel" coverage \
    --apple_platform_type=ios \
    --test_env="LLVM_PROFILE_FILE=\"$git_root/CoverageData/Coverage.profraw\"" \
    --experimental_use_llvm_covmap \
    --spawn_strategy=standalone \
    --cache_test_results=no \
    --test_env=LCOV_MERGER=/usr/bin/true \
    --build_event_json_file=bep.json \
    -- //:PlayerUI-Unit-Unit //:PlayerUI-UI-ViewInspectorTests -//:PlayerUI-UI-XCUITests

xcrun llvm-profdata merge "$git_root/CoverageData/Coverage.profraw" -output "$git_root/CoverageData/Coverage.profdata"

find "$git_root/bazel-out/"* -name 'PlayerUI-UI-ViewInspectorTests.xctest' -exec \
    xcrun llvm-cov export \
    --ignore-filename-regex=".*external\/Pods.*" \
    --ignore-filename-regex=".*ios\/packages\/.*\/ViewInspector/*" \
    --ignore-filename-regex=".*ios\/plugins\/.*\/ViewInspector/*" \
    --instr-profile="$git_root/CoverageData/Coverage.profdata" \
    --format=lcov \
    {}/PlayerUI-UI-ViewInspectorTests \
    > "$git_root/CoverageData/viewinspector.lcov" \;

find "$git_root/bazel-out/"* -name 'PlayerUI-Unit-Unit.xctest' -exec \
    xcrun llvm-cov export \
    --ignore-filename-regex=".*external\/Pods.*" \
    --ignore-filename-regex=".*ios\/packages\/.*\/Tests/*" \
    --ignore-filename-regex=".*ios\/plugins\/.*\/Tests/*" \
    --instr-profile="$git_root/CoverageData/Coverage.profdata" \
    --format=lcov \
    {}/PlayerUI-Unit-Unit \
    > "$git_root/CoverageData/unit.lcov" \;

# Merge coverage data
yarn lcov-result-merger "$git_root/CoverageData/*.lcov" "$git_root/CoverageData/coverage.dat"

# Convert to cobertura
curl https://raw.githubusercontent.com/eriwen/lcov-to-cobertura-xml/master/lcov_cobertura/lcov_cobertura.py -o lcov_cobertura.py
python lcov_cobertura.py "$git_root/CoverageData/coverage.dat" -o "$git_root/CoverageData/coverage.xml"
# python lcov_cobertura.py "$git_root/bazel-out/_coverage/_coverage_report.dat" -o "$git_root/CoverageData/coverage.xml"
rm lcov_cobertura.py
