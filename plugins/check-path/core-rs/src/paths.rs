use crate::node::Node;
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
    nodes_by_id: Rc<RefCell<HashMap<String, Rc<RefCell<Node>>>>>, // type_paths: Rc<RefCell<HashMap<String, Vec<String>>>>,
}

type View = Rc<RefCell<JsValue>>;

impl Paths {
    pub fn new() -> Self {
        Self {
            nodes_by_id: Rc::new(RefCell::new(HashMap::new())),
        }
    }

    pub fn get_node(&self, id: &str) -> Option<Rc<RefCell<Node>>> {
        let nodes_by_id = self.nodes_by_id.borrow();
        let node = nodes_by_id.get(id);
        if node.is_some() {
            return Some(Rc::clone(node.unwrap()));
        }
        None
    }

    pub fn parse(&self, root: View) {
        let mut stack: Vec<(View, Vec<Path>, Option<Rc<RefCell<Node>>>)> =
            vec![(root, vec![], None)];

        while let Some((obj, key_path, parent)) = stack.pop() {
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
                        let node_type = Reflect::get(&obj, &JsValue::from_str("type"))
                            .expect("")
                            .as_string()
                            .expect("Could not parse node type value to string.");
                        let id = js_value
                            .as_string()
                            .expect("Could not parse id value to string.");

                        log(&format!("found id: {}, type: {}", &id, &node_type));

                        let node = Rc::new(RefCell::new(Node::new(
                            id,
                            node_type,
                            None,
                            Some(Rc::new(RefCell::new(key_path.clone()))),
                        )));

                        self.nodes_by_id
                            .borrow_mut()
                            .insert(js_value.as_string().unwrap(), node);

                        if js_value.is_object() {
                            let key = if key_as_f64.is_nan() {
                                Path::Text(key_as_string)
                            } else {
                                Path::Numeric(key_as_f64)
                            };
                            let mut key_path = key_path.clone();
                            key_path.push(key);
                            stack.push((Rc::new(RefCell::new(js_value)), key_path, None))
                        }
                    }
                });
        }
    }
}
