import pluginNavData from "./plugin-nav-data.json";

export const enum Platform {
  core = "core",
  react = "react",
  ios = "ios",
  android = "android",
}

export interface Route {
  title: string;
  path?: string;
  routes?: Array<Route>;
  metaData?: {
    platform?: Array<Platform>;
  };
}

interface Navigation {
  routes: Array<Route>;
}

const navigation: Navigation = {
  routes: [
    {
      title: "Player",
      routes: [
        {
          title: "About",
          path: "/about",
        },
        {
          title: "Team",
          path: "/team",
        },
        {
          title: "FAQs",
          path: "/faqs",
        },
        {
          title: "Guides",
          routes: [
            {
              title: "Getting Started",
              path: "/getting-started",
            },
            {
              title: "Writing Plugins",
              path: "/writing-plugins",
            },
            {
              title: 'Plugin Implementation',
              path: '/plugin-implementation',
            },
            {
              title: 'Multi-Flow Experiences',
              path: '/guides/multi-flow-experiences',
            },
            {
              title: "Designing Semantic Assets",
              path: "/guides/designing-semantic-assets",
            },
          ],
        },
        {
          title: "Content",
          routes: [
            {
              title: "Overview",
              path: "/content",
            },
            {
              title: 'Navigation',
              path: '/content/navigation',
            },
            {
              title: 'Assets & Views',
              path: '/content/assets-views',
            },
            {
              title: "Data & Expressions",
              path: "/content/data-expressions",
            },
            {
              title: 'Schema',
              path: '/content/schema',
            },
          ],
        },
        {
          title: 'Authoring',
          routes: [
            {
              title: 'Overview',
              path: '/dsl',
            },
            {
              title: 'Views',
              path: '/dsl/views',
            },
            {
              title: 'Schema',
              path: '/dsl/schema',
            },
          ],
        },
        {
          title: "Assets",
          routes: [
            {
              title: "Overview",
              path: "/assets",
            },
            {
              title: "Transforms",
              path: "/assets/transforms",
            },
            {
              title: "Reference Assets",
              path: "/assets/reference",
            },
            {
              title: "Custom Assets",
              path: "/assets/custom",
            },
            {
              title: 'DSL Components',
              path: '/assets/dsl',
            },
          ],
        },
        {
          title: "Tools",
          routes: [
            {
              title: "Storybook",
              path: "/tools/storybook",
            },
            {
              title: "CLI",
              path: "/tools/cli",
            },
          ],
        },
        {
          title: "XLR",
          routes: [
            {
              title: "Intro",
              path: "/xlr/intro",
            },
            {
              title: "Concepts",
              path: "/xlr/concepts",
            },
            {
              title: "Usage",
              path: "/xlr/usage",
            },
          ],
        },
      ],
    },
    {
      title: "Plugins",
      routes: pluginNavData.routes,
    },
  ],
};

export const PATH_TO_NAV = (() => {
  const pathMap = new Map<string, string[]>();

  const expandRoutes = (route: Route, context: string[] = []) => {
    if (route.path) {
      pathMap.set(route.path, context);
    }

    route.routes?.forEach((nestedRoute) => {
      expandRoutes(nestedRoute, [...context, route.title]);
    });
  };

  navigation.routes.forEach((r) => expandRoutes(r));

  return pathMap;
})();

export default navigation;
