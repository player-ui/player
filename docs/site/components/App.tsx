import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";

import { PATH_TO_NAV } from "../config/navigation";
import { Context } from "./Context";

const router = createHashRouter([
  {
    path: "/",
    Component: React.lazy(() => import("../pages")),
  },
  ...Array.from(PATH_TO_NAV.entries()).map(([path, nav]) => {
    return {
      path,
      Component: React.lazy(() => import(`../pages${path}`)),
    };
  }),
]);

const node = document.getElementById("root") ?? document.createElement("div");

if (!document.body.contains(node)) {
  document.body.appendChild(node);
}

const root = createRoot(node);
root.render(
  <React.StrictMode>
    <ChakraProvider>
      <React.Suspense fallback={"loading..."}>
        <Context>
          <RouterProvider router={router} />
        </Context>
      </React.Suspense>
    </ChakraProvider>
  </React.StrictMode>,
);
