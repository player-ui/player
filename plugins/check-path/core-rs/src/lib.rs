use crate::paths::{Path, Paths};
use crate::query::Query;
use js_sys::Array;
use player::*;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

mod node;
mod paths;
mod player;
mod query;

const NAME: &str = "check-path-plugin";

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen(getter_with_clone)]
pub struct CheckPathPlugin {
    pub name: String,
    paths: Rc<RefCell<Paths>>,
    current_view: Rc<RefCell<JsValue>>,
}

#[wasm_bindgen]
impl CheckPathPlugin {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            name: NAME.to_string(),
            paths: Rc::new(RefCell::new(Paths::new())),
            current_view: Rc::new(RefCell::new(JsValue::undefined())),
        }
    }

    #[wasm_bindgen]
    pub fn apply(&self, player: Player) {
        let view_controller_cb = Closure::<dyn Fn(ViewController)>::new({
            let paths = Rc::clone(&self.paths);
            let current_view = Rc::clone(&self.current_view);

            move |view_controller: ViewController| {
                let view_cb = Closure::<dyn Fn(View)>::new({
                    let paths = Rc::clone(&paths);
                    let current_view = Rc::clone(&current_view);

                    move |view: View| {
                        let on_update_callback = Closure::<dyn Fn(JsValue)>::new({
                            let paths = Rc::clone(&paths);
                            let current_view = Rc::clone(&current_view);

                            move |update: JsValue| {
                                let current_view = Rc::clone(&current_view);
                                current_view.replace(update);
                                paths.borrow().parse(current_view);
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
    pub fn get_path(&self, id: &str, query: JsValue) -> JsValue {
        let _query = Query::new(query);
        let node = self.paths.borrow().get_node(id);
        if !node.is_some() {
            return JsValue::undefined();
        }

        let path = node
            .unwrap()
            .borrow()
            .get_path()
            .iter()
            .map(|path| {
                return match path {
                    // TODO: impl From<Path> for JsValue
                    Path::Text(value) => JsValue::from(value.clone()),
                    Path::Numeric(value) => JsValue::from(value.clone()),
                };
            })
            .collect::<Array>();

        JsValue::from(path)
    }

    #[wasm_bindgen(js_name=getParent)]
    pub fn get_parent(&self, id: &str) -> JsValue {
        let parent = self
            .paths
            .borrow()
            .get_node(id)
            .map(|node| node.borrow().get_parent())
            .flatten();

        match parent {
            Some(parent) => parent.borrow().get_raw_node().clone(),
            None => JsValue::UNDEFINED,
        }
    }

    #[wasm_bindgen(js_name=getParentProp)]
    pub fn get_parent_prop(&self, id: &str) -> JsValue {
        let node = self.paths.borrow().get_node(id);
        let parent = node
            .as_ref()
            .map(|node| node.borrow().get_parent())
            .flatten();

        if node.is_none() | parent.is_none() {
            return JsValue::UNDEFINED;
        }

        let parent_path_len = parent.unwrap().borrow().get_path().len();
        let parent_prop = node
            .unwrap()
            .borrow()
            .get_path()
            .get(parent_path_len)
            .map(|prop| prop.to_string());

        match parent_prop {
            Some(prop) => JsValue::from(prop),
            None => JsValue::UNDEFINED,
        }
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
    pub fn get_asset(&self, id: &str) -> JsValue {
        match self.paths.borrow().get_node(id) {
            Some(node) => node.borrow().get_raw_node().clone(),
            None => JsValue::UNDEFINED,
        }
    }
}
