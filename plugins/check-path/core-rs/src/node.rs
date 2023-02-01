use std::cell::RefCell;
use std::collections::HashSet;
use std::rc::Rc;

use wasm_bindgen::prelude::*;

use crate::paths::Path;
use crate::RefType;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[derive(Debug)]
pub struct Node {
    id: String,
    node_type: String,
    raw_node: RefType<JsValue>,
    parent: Option<RefType<Node>>,
    children: RefType<HashSet<String>>,
    path: Vec<Path>,
}

impl Node {
    pub fn new(
        id: String,
        node_type: String,
        raw_node: RefType<JsValue>,
        parent: Option<RefType<Node>>,
        path: Vec<Path>,
    ) -> Self {
        let children: RefType<HashSet<String>> = Rc::new(RefCell::new(HashSet::new()));
        Self {
            id,
            node_type,
            raw_node,
            parent,
            children,
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

    pub fn get_parent(&self) -> Option<RefType<Node>> {
        self.parent.as_ref().map(|parent| Rc::clone(parent))
    }

    pub fn get_children_ids(&self) -> RefType<HashSet<String>> {
        Rc::clone(&self.children)
    }

    pub fn add_child(&self, node_id: String) {
        self.children.borrow_mut().insert(node_id);
    }
}
