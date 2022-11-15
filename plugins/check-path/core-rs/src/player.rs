use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    pub type ViewControllerHook;

    #[wasm_bindgen(method)]
    pub fn tap(this: &ViewControllerHook, name: &str, f: &dyn Fn());
}

#[wasm_bindgen]
extern "C" {
    pub type Hooks;

    #[wasm_bindgen(method, getter)]
    pub fn viewController(this: &Hooks) -> ViewControllerHook;
}

#[wasm_bindgen(module = "@player-ui/player")]
extern "C" {
    #[wasm_bindgen(js_name = "default")]
    pub type Player;

    #[wasm_bindgen(method, getter)]
    pub fn hooks(this: &Player) -> Hooks;
}
