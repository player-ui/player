use js_sys::{Array, Function, Reflect, JSON};
use std::cell::Ref;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

pub enum Query {
    Function(Function),
    Text(String),
    Object(JsValue),
    List(Array),
    None,
}

impl Query {
    pub fn new(query: JsValue) -> Query {
        return if query.is_undefined() {
            Query::None
        } else if query.is_function() {
            let query_fun = query.unchecked_into::<Function>();
            Query::Function(query_fun)
        } else if query.is_string() {
            let query_string = query.as_string().unwrap();
            Query::Text(query_string)
        } else if query.is_object() {
            if Array::is_array(&query) {
                let query_array = query.unchecked_into::<Array>();
                Query::List(query_array)
            } else {
                Query::Object(query)
            }
        } else {
            Query::None
        };
    }

    pub fn equals(&self, obj: Ref<JsValue>) -> bool {
        let compare_obj_query = |value: JsValue| {
            let keys = Reflect::own_keys(&value).unwrap_or(Array::new());
            for key in keys.iter() {
                if Reflect::has(&obj, &key).is_err() {
                    return false;
                } else {
                    let search_value = Reflect::get(&value, &key).unwrap();
                    if search_value != Reflect::get(&obj, &key).unwrap() {
                        return false;
                    }
                }
            }
            true
        };
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
            Query::List(list) => list
                .iter()
                .map(compare_obj_query)
                .collect::<Vec<bool>>()
                .contains(&true),
            /* TODO: this cloning can be prevented by Rc<RefCell> */
            Query::Object(value) => compare_obj_query(value.to_owned()),
            _ => false,
        }
    }
}
