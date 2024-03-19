package com.intuit.playerui.core.validation

import com.intuit.playerui.core.bridge.global.JSMap
import kotlinx.serialization.Serializable

public typealias ValidationMapping = JSMap<BindingInstance, ValidationResponse>

@Serializable
public data class ValidationInfo(
    val canTransition: Boolean,
    val validations: ValidationMapping? = null,
)
