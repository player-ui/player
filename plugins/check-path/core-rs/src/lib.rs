use crate::node::Node;
use crate::paths::{Path, Paths};
use crate::queries::{Queries, Query};
use js_sys::{Array, JSON};
use player::*;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

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
        if !node.is_some() {
            return JsValue::undefined();
        }

        let node = node.as_ref().unwrap();
        let results: Vec<Option<String>> = vec![];

        for q in queries {}

        // match query {
        //     Queries::None => JsValue::from(
        //         node.borrow()
        //             .get_path()
        //             .iter()
        //             .map(Paths::to_js_value)
        //             .collect::<Array>(),
        //     ),
        //     _ => {
        //         let results = self.search_for_node(&query, Rc::clone(node), false);
        //         let node = node.borrow();
        //         let base_path = node.get_path();
        //         if !results.is_empty() {
        //             let found_node = match query {
        //                 //     /* when Query is an array, the last match is the one we want */
        //                 Queries::List(_) => {
        //                     log(&format!(
        //                         "result count: {}, first id: {}, last id: {}",
        //                         results.len(),
        //                         results.first().unwrap().borrow().get_id(),
        //                         results.last().unwrap().borrow().get_id(),
        //                     ));
        //
        //                     results.last().unwrap().borrow()
        //                 }
        //                 //     /* when Query is NOT an array, the first match is the one we want */
        //                 _ => results.first().unwrap().borrow(),
        //             };
        //             let found_node_path = found_node.get_path();
        //             return JsValue::from(
        //                 base_path
        //                     .iter()
        //                     .skip(found_node_path.len())
        //                     .map(Paths::to_js_value)
        //                     .collect::<Array>(),
        //             );
        //         }
        //
        //         JsValue::UNDEFINED
        //     }
        // }

        // TODO: Remove
        return JsValue::undefined();
    }

    #[wasm_bindgen(js_name=getParent)]
    pub fn get_parent(&self, id: &str, query: JsValue) -> JsValue {
        let query = Queries::from(query);

        let parent = self
            .paths
            .borrow()
            .get_node(id)
            .map(|node| node.borrow().get_parent())
            .flatten();

        match parent {
            Some(parent) => {
                // let results = self.search_for_node(&query, Rc::clone(&parent), false);
                // let result = results
                //     .first()
                //     .map(|node| node.borrow().get_raw_node().clone());
                //
                // match result {
                //     Some(result) => result,
                //     None => JsValue::UNDEFINED,
                // }
                JsValue::UNDEFINED
            }

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

        if node.is_none() | parent.is_none() {
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
        return !self.get_parent(id, query).is_undefined();
    }

    #[wasm_bindgen(js_name=getAsset)]
    pub fn get_asset(&self, id: &str) -> JsValue {
        match self.paths.borrow().get_node(id) {
            Some(node) => node.borrow().get_raw_node().clone(),
            None => JsValue::UNDEFINED,
        }
    }

    fn search_for_node(
        &self,
        query: &Query,
        start_at: Rc<RefCell<Node>>,
        // TODO: implement searching down tree.
        _descendants: bool,
    ) -> Vec<Rc<RefCell<Node>>> {
        let mut nodes = vec![Rc::clone(&start_at)];
        let mut results = vec![];
        while let Some(node) = nodes.pop() {
            let current_node = node.borrow();
            let raw_node = current_node.get_raw_node();
            let matched = query.equals(raw_node);

            if matched {
                results.push(Rc::clone(&node));
            }
            let next_node = current_node.get_parent();
            if next_node.is_some() {
                nodes.push(next_node.unwrap());
            }
        }
        return results;
    }
}
