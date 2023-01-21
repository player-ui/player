use crate::paths::Path;
use std::cell::{Ref, RefCell};
use std::rc::Rc;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

pub struct Node {
    id: String,
    node_type: String,
    raw_node: Rc<RefCell<JsValue>>,
    parent: Option<Rc<RefCell<Node>>>,
    path: Vec<Path>,
}

impl Node {
    pub fn new(
        id: String,
        node_type: String,
        raw_node: Rc<RefCell<JsValue>>,
        parent: Option<Rc<RefCell<Node>>>,
        path: Vec<Path>,
    ) -> Self {
        Self {
            id,
            node_type,
            raw_node,
            parent,
            path,
        }
    }

    pub fn get_path(&self) -> &Vec<Path> {
        &self.path
    }

    pub fn get_id(&self) -> &str {
        &self.id
    }

    pub fn get_type(&self) -> &str {
        &self.node_type
    }

    pub fn get_raw_node(&self) -> JsValue {
        self.raw_node.borrow().clone()
    }

    pub fn has_parent(&self) -> bool {
        self.parent.is_some()
    }

    pub fn get_parent(&self) -> Option<Rc<RefCell<Node>>> {
        self.parent.as_ref().map(|parent| Rc::clone(parent))
    }
}
