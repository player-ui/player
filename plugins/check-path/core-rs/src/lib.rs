#![allow(non_snake_case)]

mod player;

use player::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen(getter_with_clone)]
pub struct CheckPathPlugin {
    pub name: String,
}

#[wasm_bindgen]
impl CheckPathPlugin {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            name: String::from("check-path-plugin"),
        }
    }

    #[wasm_bindgen]
    pub fn apply(&self, player: Player) {
        player
            .hooks()
            .viewController()
            .tap(&self.name, &|| log("VIEW CONTROLLER TAP"));
    }
}
