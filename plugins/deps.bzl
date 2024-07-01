load("//plugins/beacon/jvm:deps.bzl", beacon = "maven")
load("//plugins/check-path/jvm:deps.bzl", check_path = "maven")
load("//plugins/coroutines/jvm:deps.bzl", coroutines = "maven")
load("//plugins/expression/jvm:deps.bzl", expression = "maven")
load("//plugins/external-action/jvm:deps.bzl", external_action = "maven")
load("//plugins/java-logger/jvm:deps.bzl", java_logger = "maven")
load("//plugins/metrics/jvm:deps.bzl", metrics = "maven")
load("//plugins/pending-transaction/jvm:deps.bzl", pending_transaction = "maven")
load("//plugins/pubsub/jvm:deps.bzl", pubsub = "maven")
load("//plugins/reference-assets/android:defs.bzl", reference_assets = "maven")
load("//plugins/set-time-out/jvm:deps.bzl", set_time_out = "maven")
load("//plugins/slf4j-logger/jvm:deps.bzl", slf4j_logger = "maven")

maven = beacon + check_path + coroutines + expression + external_action + java_logger + metrics + pending_transaction + pubsub + reference_assets + set_time_out + slf4j_logger
