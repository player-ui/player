# Hermes

### Building

#### C++ Binaries:
`libfbjni`: from AAR released [here](https://github.com/facebookincubator/fbjni)

`libc++_shared`: associated with NDK version, currently 27.1.12297006

`libhermes`/`libjsi`: custom built from [here](https://github.com/facebook/react-native) by running `./gradlew build -DCMAKE_BUILD_TYPE=MinSizeRel`.    
The artifacts are located in `ReactAndroid/build/outputs` and `ReactAndroid/hermes-engine/build/outputs`
