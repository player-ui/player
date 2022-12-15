use crate::paths::Path;
use std::cell::RefCell;
use std::rc::Rc;

pub struct Node {
    node_type: String,
    id: String,
    parent: Option<Rc<RefCell<Node>>>,
    path: Rc<RefCell<Vec<Path>>>,
}

impl Node {
    pub fn new(
        id: String,
        node_type: String,
        parent: Option<Rc<RefCell<Node>>>,
        path: Option<Rc<RefCell<Vec<Path>>>>,
    ) -> Self {
        Self {
            id,
            node_type,
            parent,
            path: path.unwrap_or(Rc::new(RefCell::new(vec![]))),
        }
    }

    pub fn get_path(&self) -> Rc<RefCell<Vec<Path>>> {
        self.path.clone()
    }
}
