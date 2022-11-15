use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    pub type AfterResolveHook;
    // view.hooks.resolver.tap() return value
    // access resolver.hooks.afterResolve.tap
    #[wasm_bindgen(method)]
    pub fn tap(this: &AfterResolveHook, name: &str, f: &JsValue);
}

#[wasm_bindgen]
extern "C" {
    pub type ResolverHooks;
    // view.hooks.resolver.tap() return value
    // access resolver.hooks.afterResolve
    #[wasm_bindgen(method, getter, js_name = afterResolve)]
    pub fn after_resolve(this: &ResolverHooks) -> AfterResolveHook;
}

#[wasm_bindgen]
extern "C" {
    pub type Resolver;
    // view.hooks.resolver.tap() return value
    // access resolver.hooks
    #[wasm_bindgen(method, getter)]
    pub fn hooks(this: &Resolver) -> ResolverHooks;
}

#[wasm_bindgen]
extern "C" {
    pub type ResolverHook;
    // viewController.hooks.view.tap() return value.
    // access view.hooks.resolver.tap()
    #[wasm_bindgen(method)]
    pub fn tap(this: &ResolverHook, name: &str, f: &JsValue);
}

#[wasm_bindgen]
extern "C" {
    pub type ViewHooks;
    // viewController.hooks.view.tap() return value.
    // access view.hooks.resolver
    #[wasm_bindgen(method, getter)]
    pub fn resolver(this: &ViewHooks) -> ResolverHook;
}

#[wasm_bindgen]
extern "C" {
    pub type View;

    // viewController.hooks.view.tap() return value.
    // access view.hooks
    #[wasm_bindgen(method, getter)]
    pub fn hooks(this: &View) -> ViewHooks;
}

#[wasm_bindgen]
extern "C" {
    pub type ViewHook;

    // player.hooks.viewController.tap() return value.
    // access viewController.hooks.view.tap
    #[wasm_bindgen(method)]
    pub fn tap(this: &ViewHook, name: &str, f: &JsValue);
}

#[wasm_bindgen]
extern "C" {
    pub type ViewControllerHooks;

    // player.hooks.viewController.tap() return value.
    // access viewController.hooks.view
    #[wasm_bindgen(method, getter)]
    pub fn view(this: &ViewControllerHooks) -> ViewHook;
}

#[wasm_bindgen]
extern "C" {
    pub type ViewController;

    // player.hooks.viewController.tap() return value.
    // access viewController.hooks
    #[wasm_bindgen(method, getter)]
    pub fn hooks(this: &ViewController) -> ViewControllerHooks;
}

#[wasm_bindgen]
extern "C" {
    pub type ViewControllerHook;

    // access player.hooks.viewController.tap
    #[wasm_bindgen(method)]
    pub fn tap(this: &ViewControllerHook, name: &str, f: &JsValue);
}

#[wasm_bindgen]
extern "C" {
    pub type PlayerHooks;

    // access player.hooks.viewController
    #[wasm_bindgen(method, getter)]
    pub fn viewController(this: &PlayerHooks) -> ViewControllerHook;
}

#[wasm_bindgen(module = "@player-ui/player")]
extern "C" {
    #[wasm_bindgen(js_name = "default")]
    pub type Player;

    // access player.hooks
    #[wasm_bindgen(method, getter)]
    pub fn hooks(this: &Player) -> PlayerHooks;
}
