use js_sys::JsString;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use player::*;

mod player;

const NAME: &str = "check-path-plugin";

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
            name: NAME.clone().to_string(),
        }
    }

    #[wasm_bindgen]
    pub fn apply(&self, player: Player) {
        let view_controller_cb =
            Closure::<dyn Fn(ViewController)>::new(move |view_controller: ViewController| {
                let view_cb = Closure::<dyn Fn(View)>::new(|view: View| {
                    let resolver_cb = Closure::<dyn Fn(Resolver)>::new(|resolver: Resolver| {
                        let after_resolve_cb = Closure::<dyn Fn(JsValue, JsValue)>::new(
                            |value: JsValue, node: JsValue| {
                                if value.is_object() {
                                    let keys: Vec<String> = js_sys::Reflect::own_keys(&value)
                                        .unwrap()
                                        .into_serde()
                                        .unwrap();
                                    for key in keys.iter() {
                                        log(&key)
                                    }
                                }
                            },
                        );
                        resolver
                            .hooks()
                            .after_resolve()
                            .tap("TEST", after_resolve_cb.as_ref().unchecked_ref());
                        after_resolve_cb.forget();
                    });
                    view.hooks()
                        .resolver()
                        .tap(&NAME, resolver_cb.as_ref().unchecked_ref());
                    resolver_cb.forget();
                });
                view_controller
                    .hooks()
                    .view()
                    .tap(&NAME, view_cb.as_ref().unchecked_ref());
                view_cb.forget();
            });
        player
            .hooks()
            .viewController()
            .tap(&NAME, view_controller_cb.as_ref().unchecked_ref());
        view_controller_cb.forget();
    }
}
