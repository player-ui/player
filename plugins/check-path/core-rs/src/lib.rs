use js_sys::Array;
use player::*;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use crate::paths::Paths;

mod paths;
mod player;

const NAME: &str = "check-path-plugin";

#[wasm_bindgen(getter_with_clone)]
pub struct CheckPathPlugin {
    pub name: String,
    paths: Rc<RefCell<Paths>>,
}

#[wasm_bindgen]
impl CheckPathPlugin {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            name: NAME.to_string(),
            paths: Rc::new(RefCell::new(Paths::new())),
        }
    }

    #[wasm_bindgen]
    pub fn apply(&self, player: Player) {
        let view_controller_cb = Closure::<dyn Fn(ViewController)>::new({
            let paths = Rc::clone(&self.paths);
            move |view_controller: ViewController| {
                let view_cb = Closure::<dyn Fn(View)>::new({
                    let paths = Rc::clone(&paths);
                    move |view: View| {
                        let on_update_callback = Closure::<dyn Fn(JsValue)>::new({
                            let paths = Rc::clone(&paths);
                            move |update: JsValue| {
                                paths.borrow().parse(update);
                            }
                        });
                        view.hooks()
                            .on_update()
                            .tap(&NAME, on_update_callback.as_ref().unchecked_ref());

                        on_update_callback.forget();
                    }
                });
                view_controller
                    .hooks()
                    .view()
                    .tap(&NAME, view_cb.as_ref().unchecked_ref());

                view_cb.forget();
            }
        });
        player
            .hooks()
            .viewController()
            .tap(&NAME, view_controller_cb.as_ref().unchecked_ref());
        view_controller_cb.forget();
    }

    #[wasm_bindgen(js_name=getPath)]
    pub fn get_path(&self, id: &str) -> js_sys::Array {
        let value = self.paths.borrow().get(id);

        value.into_iter().map(JsValue::from).collect()
    }

    #[wasm_bindgen(js_name=getParent)]
    pub fn get_parent(&self) -> JsValue {
        return JsValue::undefined();
    }

    #[wasm_bindgen(js_name=getParentProp)]
    pub fn get_parent_prop(&self) -> JsValue {
        return JsValue::undefined();
    }

    #[wasm_bindgen(js_name=hasChildContext)]
    pub fn has_child_context(&self) -> bool {
        return false;
    }

    #[wasm_bindgen(js_name=hasParentContext)]
    pub fn has_parent_context(&self) -> bool {
        return false;
    }

    #[wasm_bindgen(js_name=getAsset)]
    pub fn get_asset(&self) -> JsValue {
        return JsValue::undefined();
    }
}
