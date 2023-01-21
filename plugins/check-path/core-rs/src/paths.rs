use crate::node::Node;
use js_sys::{Array, Number, Reflect};
use std::cell::RefCell;
use std::collections::HashMap;
use std::fmt;
use std::fmt::{Debug, Formatter};
use std::rc::Rc;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[derive(Clone, Debug)]
pub enum Path {
    Text(String),
    Numeric(f64),
}
impl fmt::Display for Path {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Path::Text(value) => std::fmt::Display::fmt(&value, f),
            Path::Numeric(value) => std::fmt::Display::fmt(&value, f),
        }
    }
}

pub struct Paths {
    nodes_by_id: Rc<RefCell<HashMap<String, Rc<RefCell<Node>>>>>,
}

type SomeRef<T> = Rc<RefCell<T>>;
type ViewRef = SomeRef<JsValue>;
type NodeRef = SomeRef<Node>;

impl Paths {
    pub fn new() -> Self {
        Self {
            nodes_by_id: Rc::new(RefCell::new(HashMap::new())),
        }
    }

    pub fn get_node(&self, id: &str) -> Option<Rc<RefCell<Node>>> {
        let nodes_by_id = self.nodes_by_id.borrow();
        let node = nodes_by_id.get(id);

        node.map(Rc::clone)
    }

    pub fn parse(&self, root: ViewRef) {
        self.clear_nodes();
        let mut stack: Vec<(ViewRef, Vec<Path>, Option<NodeRef>)> = vec![(root, vec![], None)];

        while let Some((obj, key_path, parent)) = stack.pop() {
            // make a node if current object is eligible.
            let node = Paths::make_node(
                &obj,
                // to prevent cloning the array, maybe we can use a ref to the same array with slices.
                key_path.clone(),
                parent.as_ref().map(Rc::clone),
            );

            if node.as_ref().is_some() {
                self.nodes_by_id.borrow_mut().insert(
                    node.as_ref().unwrap().borrow().get_id().to_owned(),
                    node.as_ref().map(Rc::clone).unwrap(),
                );
            }

            // Keep looking for nodes by finding more objects.
            let obj = obj.borrow();
            Reflect::own_keys(&obj)
                .unwrap_or(Array::new())
                .iter()
                .for_each(|js_key| {
                    let key_as_string = js_key.as_string().expect("Could not read key");
                    let key_as_f64 = Number::parse_int(&key_as_string, 10);
                    let js_value = Reflect::get(&obj, &JsValue::from_str(&key_as_string))
                        .expect(&format!("Couldn't read value for key {}", &key_as_string));

                    if js_value.is_object() {
                        let key = if key_as_f64.is_nan() {
                            Path::Text(key_as_string)
                        } else {
                            Path::Numeric(key_as_f64)
                        };
                        let mut key_path = key_path.clone();
                        key_path.push(key);

                        let parent = if node.is_some() {
                            node.as_ref().map(Rc::clone)
                        } else if parent.is_some() {
                            parent.as_ref().map(Rc::clone)
                        } else {
                            None
                        };
                        stack.push((Rc::new(RefCell::new(js_value)), key_path, parent));
                    }
                });
        }
    }

    fn make_node(
        obj: &SomeRef<JsValue>,
        key_path: Vec<Path>,
        parent: Option<NodeRef>,
    ) -> Option<Rc<RefCell<Node>>> {
        let raw_node = obj.borrow();
        let id = Reflect::get(&raw_node, &JsValue::from_str("id")).unwrap();
        let node_type = Reflect::get(&raw_node, &JsValue::from_str("type")).unwrap();

        return if let (Some(id), Some(node_type)) = (id.as_string(), node_type.as_string()) {
            let node = Node::new(id, node_type, Rc::clone(obj), parent, key_path);
            Some(Rc::new(RefCell::new(node)))
        } else {
            None
        };
    }

    fn clear_nodes(&self) {
        let mut nodes = self.nodes_by_id.borrow_mut();
        nodes.clear();
    }

    pub fn to_js_value(path: &Path) -> JsValue {
        return match path {
            Path::Text(value) => JsValue::from(value.clone()),
            Path::Numeric(value) => JsValue::from(value.clone()),
        };
    }
}
