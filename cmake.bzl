CMAKE_BUILD_TYPE_COPT_MAPPINGS = {
    "Debug": [
        "-O0",
        "-g",
    ],
    "Release": [
        "-O3",
        "-DNDEBUG",
    ],
    "MinSizeRel": [
        "-Os",
        "-DNDEBUG",
    ],
    "RelWithDebInfo": [
        "-O2",
        "-g",
        "-DNDEBUG",
    ],
}

CMAKE_BUILD_TYPE_COPTS = select({
    "//:cmake_build_type_debug": CMAKE_BUILD_TYPE_COPT_MAPPINGS["Debug"],
    "//:cmake_build_type_release": CMAKE_BUILD_TYPE_COPT_MAPPINGS["Release"],
    "//:cmake_build_type_minsizerel": CMAKE_BUILD_TYPE_COPT_MAPPINGS["MinSizeRel"],
    "//:cmake_build_type_relwithdebinfo": CMAKE_BUILD_TYPE_COPT_MAPPINGS["RelWithDebInfo"],
    "//conditions:default": [],
})
