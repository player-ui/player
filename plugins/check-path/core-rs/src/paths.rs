use js_sys::{Array, Number, Reflect};
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[derive(Clone)]
pub enum Path {
    Text(String),
    Numeric(f64),
}

pub struct Paths {
    key_paths: Rc<RefCell<HashMap<String, Vec<Path>>>>,
    // type_paths: Rc<RefCell<HashMap<String, Vec<String>>>>,
}

type View = Rc<RefCell<JsValue>>;

impl Paths {
    pub fn new() -> Self {
        Self {
            key_paths: Rc::new(RefCell::new(HashMap::new())),
            // type_paths: Rc::new(RefCell::new(HashMap::new())),
        }
    }

    pub fn get(&self, key: &str) -> Vec<Path> {
        self.key_paths.borrow().get(key).unwrap_or(&vec![]).clone()
    }

    pub fn parse(&self, root: View) {
        let mut stack: Vec<(View, Vec<Path>)> = vec![(root, vec![])];

        while let Some((obj, key_path)) = stack.pop() {
            let obj = obj.borrow();
            Reflect::own_keys(&obj)
                .unwrap_or(Array::new())
                .iter()
                .for_each(|js_key| {
                    let key_as_string = js_key.as_string().expect("Could not read key");
                    let key_as_f64 = Number::parse_int(&key_as_string, 10);
                    let js_value = Reflect::get(&obj, &JsValue::from_str(&key_as_string))
                        .expect(&format!("Couldn't read value for key {}", &key_as_string));

                    if key_as_string == "id" {
                        self.key_paths
                            .borrow_mut()
                            .insert(js_value.as_string().unwrap(), key_path.clone());
                    }

                    if js_value.is_object() {
                        let key = if key_as_f64.is_nan() {
                            Path::Text(key_as_string)
                        } else {
                            Path::Numeric(key_as_f64)
                        };
                        let mut key_path = key_path.clone();
                        key_path.push(key);
                        stack.push((Rc::new(RefCell::new(js_value)), key_path))
                    }

                    // log(&format!("{:?}", key_path))
                });
        }
    }
}
