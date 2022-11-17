use js_sys::Reflect;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

enum NodeValue {
    StringType(String),
    ObjectType(JsValue),
    None,
}

pub struct Paths {
    store: Rc<RefCell<HashMap<String, Vec<String>>>>,
}

impl Paths {
    pub fn new() -> Self {
        Self {
            store: Rc::new(RefCell::new(HashMap::new())),
        }
    }

    pub fn parse(&self, data: JsValue) {
        self.traverse(data);
    }

    fn traverse(&self, root: JsValue) {
        let path: Vec<String> = vec![];
        let mut stack =
            Paths::get_key_values(&root, path.clone()).expect("Couldn't read root node.");
        while let Some((key, value, path)) = stack.pop() {
            if let NodeValue::StringType(_value) = value {
                if key == "id" || key == "type" {
                    self.store.borrow_mut().insert(key, path);
                }
            } else if let NodeValue::ObjectType(value) = value {
                let mut object_path = path.clone();
                object_path.push(key);
                stack.append(Paths::get_key_values(&value, object_path).unwrap().as_mut());
            }
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
}
