use crate::RefType;
use js_sys::{Array, Function, Iter, Reflect, JSON};
use std::cell::{Ref, RefCell};
use std::ops::Index;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[derive(Clone, Debug)]
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

    fn compare_obj(obj: &JsValue, query_value: &JsValue) -> bool {
        let keys = Reflect::own_keys(&query_value).unwrap_or(Array::new());
        for key in keys.iter() {
            log(&format!("Looking for key: {}", key.as_string().unwrap()));
            if Reflect::has(&obj, &key).is_err() {
                log(&format!("key not found in search object..."));
                return false;
            } else {
                let search_value = Reflect::get(&query_value, &key).unwrap();
                log(&format!("Key found in current node... comparing values",));

                if search_value != Reflect::get(&obj, &key).unwrap() {
                    log(&format!(
                        "in object: {}\nNOT FOUND\n",
                        &JSON::stringify(&obj).unwrap(),
                    ));
                    return false;
                } else {
                    log(&format!(
                        "in object: {}\nEUREKA!!\n",
                        &JSON::stringify(&obj).unwrap(),
                    ));
                }
            }
        }
        log("COMPARING DONE");
        true
    }

    /**
     * Compares a query instance to a JsValue object.
     * In Array queries only:
     * If the query is satisfied with the JsValue, the function returns a new Query to be used in
     * future JsValue matching, this is due to the fact that all queries in a list queries must be
     * satisfied in some search cases, for that purpose, successful results create a new query with
     * found elements removed.
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
                        log("string query matched");
                        return true;
                    }
                }
                false
            }
            Query::Function(_fun) => todo!(),
            /* This is not needed - lists are handled by Queries Struct */
            Query::List(_list) => todo!(),
            /* TODO: this cloning can be prevented by Rc<RefCell> */
            Query::Object(value) => Query::compare_obj(&obj, &value),
        }
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
        let result = if let Query::List(query_list) = query {
            let queries = query_list
                .iter()
                .map(|query| Query::parse(query))
                .collect::<Vec<Query>>();
            Self {
                curr: 0,
                length: Rc::new(RefCell::new(queries.len())),
                values: Rc::new(RefCell::new(queries)),
            }
        } else {
            Self {
                curr: 0,
                length: Rc::new(RefCell::new(0)),
                values: Rc::new(RefCell::new(vec![])),
            }
        };

        return result;
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
