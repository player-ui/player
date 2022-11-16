use std::collections::HashMap;

use js_sys::Reflect;
use serde_wasm_bindgen;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use player::*;

mod player;

const NAME: &str = "check-path-plugin";
const ID_KEY: &str = "id";

enum NodeValue {
    StringType(String),
    ObjectType(JsValue),
    None,
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen(getter_with_clone)]
pub struct CheckPathPlugin {
    pub name: String,
    paths: HashMap<String, String>,
}

#[wasm_bindgen]
impl CheckPathPlugin {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            name: NAME.clone().to_string(),
            paths: HashMap::new(),
        }
    }

    fn get_key_values(
        value: &JsValue,
        path: Vec<String>,
    ) -> Option<Vec<(String, NodeValue, Vec<String>)>> {
        if !value.is_object() {
            return None;
        }
        let keys = Reflect::own_keys(&value).unwrap();
        let len = keys.length();

        let mut result = Vec::with_capacity(len as usize);
        for i in 0..len {
            let raw_key = keys.get(i);
            let raw_value = Reflect::get(&value, &raw_key).unwrap();

            let key: String = serde_wasm_bindgen::from_value(raw_key).unwrap();

            let value: NodeValue = if raw_value.is_object() {
                NodeValue::ObjectType(raw_value)
            } else if raw_value.is_string() {
                NodeValue::StringType(serde_wasm_bindgen::from_value(raw_value).unwrap())
            } else {
                NodeValue::None
            };

            result.push((key, value, path.clone()))
        }

        Some(result)
    }

    #[wasm_bindgen]
    pub fn apply(&self, player: Player) {
        let view_controller_cb =
            Closure::<dyn Fn(ViewController)>::new(|view_controller: ViewController| {
                let view_cb = Closure::<dyn Fn(View)>::new(|view: View| {
                    let on_update_callback =
                        Closure::<dyn Fn(JsValue)>::new(move |update: JsValue| {
                            CheckPathPlugin::traverse(update);
                        });

                    view.hooks()
                        .on_update()
                        .tap(&NAME, on_update_callback.as_ref().unchecked_ref());

                    on_update_callback.forget();
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

    fn traverse(root: JsValue) {
        let map: HashMap<String, Vec<&str>> = HashMap::new();
        let mut path: Vec<String> = vec![];
        let mut stack =
            CheckPathPlugin::get_key_values(&root, path.clone()).expect("Couldn't read root node.");
        while let Some((key, value, mut path)) = stack.pop() {
            if let NodeValue::StringType(value) = value {
                log(&format!("[{}]: {} \t path: {}", key, value, path.join(".")))
            } else if let NodeValue::ObjectType(value) = value {
                let mut object_path = path.clone();
                object_path.push(key);
                stack.append(
                    CheckPathPlugin::get_key_values(&value, object_path)
                        .unwrap()
                        .as_mut(),
                );
            }
        }
    }
}
