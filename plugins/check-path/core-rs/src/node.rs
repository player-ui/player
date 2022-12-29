use crate::paths::Path;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

pub struct Node {
    node_type: String,
    id: String,
    parent: Option<Rc<RefCell<Node>>>,
    path: Vec<Path>,
}

impl Node {
    pub fn new(
        id: String,
        node_type: String,
        parent: Option<Rc<RefCell<Node>>>,
        path: Vec<Path>,
    ) -> Self {
        Self {
            id,
            node_type,
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

    pub fn has_parent(&self) -> bool {
        self.parent.is_some()
    }

    pub fn get_parent(&self) -> Option<Rc<RefCell<Node>>> {
        self.parent.as_ref().map(|parent| Rc::clone(parent))
    }
}
