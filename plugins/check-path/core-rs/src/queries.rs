use std::cell::RefCell;
use std::rc::Rc;

use js_sys::{Array, Function, Reflect};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use crate::RefType;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[derive(Clone, Debug, PartialEq)]
pub enum Query {
    Function(Function),
    Text(String),
    Object(JsValue),
    List(Array),
    None,
}
impl Query {
    pub fn parse(js_value: JsValue) -> Self {
        return if js_value.is_undefined() {
            Query::None
        } else if js_value.is_function() {
            let js_value_fun = js_value.unchecked_into::<Function>();
            Query::Function(js_value_fun)
        } else if js_value.is_string() {
            let js_value_string = js_value.as_string().unwrap();
            Query::Text(js_value_string)
        } else if js_value.is_object() {
            if Array::is_array(&js_value) {
                let js_value_array = js_value.unchecked_into::<Array>();
                Query::List(js_value_array)
            } else {
                Query::Object(js_value)
            }
        } else {
            Query::None
        };
    }

    /**
     * Compares a query instance to a JsValue object.
     */
    pub fn equals(&self, obj: JsValue) -> bool {
        match self {
            // When no query, every JsValue matches.
            Query::None => true,
            Query::Text(str) => {
                let keys = Reflect::own_keys(&obj).unwrap();
                for key in keys.iter() {
                    let found_value = Reflect::get(&obj, &key).unwrap();
                    if found_value.is_string() && str.to_owned() == found_value.as_string().unwrap()
                    {
                        return true;
                    }
                }
                false
            }
            Query::Function(_fun) => todo!(),
            /* This is not needed - lists are handled by Queries Struct */
            Query::List(_list) => todo!(),
            /* TODO: this cloning can be prevented by Rc<RefCell> */
            Query::Object(value) => Query::compare(&obj, &value),
        }
    }

    /**
     * Compare a query object to given object
     */
    fn compare(obj: &JsValue, query_value: &JsValue) -> bool {
        let query_keys = Reflect::own_keys(&query_value).unwrap_or(Array::new());
        !query_keys
            .iter()
            .map(|key| {
                if Reflect::has(&obj, &key).is_err() {
                    false
                } else {
                    let search_value = Reflect::get(&query_value, &key).unwrap();
                    if search_value != Reflect::get(&obj, &key).unwrap() {
                        false
                    } else {
                        true
                    }
                }
            })
            .collect::<Vec<bool>>()
            .contains(&false)
    }
}

#[derive(Debug)]
pub struct Queries {
    curr: usize,
    pub length: RefType<usize>,
    pub values: RefType<Vec<Query>>,
}

impl From<JsValue> for Queries {
    fn from(js_value: JsValue) -> Self {
        let query = Query::parse(js_value);
        let values = if let Query::List(query_list) = query {
            query_list
                .iter()
                .map(|query| Query::parse(query))
                .collect::<Vec<Query>>()
        } else if Query::None != query {
            vec![query]
        } else {
            vec![]
        };
        Self {
            curr: 0,
            length: Rc::new(RefCell::new(values.len())),
            values: Rc::new(RefCell::new(values)),
        }
    }
}

impl Iterator for Queries {
    type Item = Query;
    fn next(&mut self) -> Option<Self::Item> {
        let length = self.length.borrow();
        if self.curr < *length {
            self.curr += 1;
            Some(self.values.borrow()[self.curr - 1].clone())
        } else {
            None
        }
    }
}
