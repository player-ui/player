use std::cell::RefCell;
use std::rc::Rc;

use js_sys::Array;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use player::*;

use crate::node::Node;
use crate::paths::Paths;
use crate::queries::Queries;

mod node;
mod paths;
mod player;
mod queries;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

const NAME: &str = "check-path-plugin";
pub type RefType<T> = Rc<RefCell<T>>;

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
        let queries = Queries::from(query);
        let node = self.paths.borrow().get_node(id);

        match node {
            Some(node) => {
                let found_node = self.search(Rc::clone(&node), queries, false);
                let relative_path_len = found_node
                    .as_ref()
                    .map(|node| node.borrow().get_path().len());

                JsValue::from(
                    node.borrow()
                        .get_path()
                        .iter()
                        .skip(if let Some(relative_path_len) = relative_path_len {
                            relative_path_len
                        } else {
                            0
                        })
                        .map(Paths::js_value)
                        .collect::<Array>(),
                )
            }
            None => JsValue::UNDEFINED,
        }
    }

    #[wasm_bindgen(js_name=getParent)]
    pub fn get_parent(&self, id: &str, query: JsValue) -> JsValue {
        let _query = Queries::from(query);

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

        if node.is_none() || parent.is_none() {
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
    pub fn has_parent_context(&self, id: &str, query: JsValue) -> bool {
        let queries = Queries::from(query);
        let node = self.paths.borrow().get_node(id);

        match node {
            Some(node) => {
                let found_node = self.search(Rc::clone(&node), queries, false);
                found_node.is_some()
            }
            None => false,
        }
    }

    #[wasm_bindgen(js_name=getAsset)]
    pub fn get_asset(&self, id: &str) -> JsValue {
        match self.paths.borrow().get_node(id) {
            Some(node) => node.borrow().get_raw_node().clone(),
            None => JsValue::UNDEFINED,
        }
    }

    fn search(
        &self,
        start_at: RefType<Node>,
        queries: Queries,
        _in_descendants: bool,
    ) -> Option<RefType<Node>> {
        let mut stack = vec![Rc::clone(&start_at)];
        let mut found_node = None;
        'queries: for query in queries {
            while let Some(current) = stack.pop() {
                let is_match = query.equals(current.borrow().get_raw_node());
                if is_match {
                    found_node = Some(Rc::clone(&current));
                    if let Some(parent) = current.borrow().get_parent() {
                        stack.push(Rc::clone(&parent))
                    }
                    continue 'queries;
                } else if let Some(parent) = current.borrow().get_parent() {
                    stack.push(Rc::clone(&parent))
                } else {
                    return None;
                }
            }
        }

        return found_node;
    }
}
