import { bench, describe } from "vitest";
import { adaptA2UIToFlow } from "../adapter";
import type { A2UIComponent, A2UISnapshot } from "../types";

function makeTiny(): A2UISnapshot {
  return {
    surfaceId: "tiny",
    components: [
      { id: "root", component: "Card", child: "t" },
      { id: "t", component: "Text", text: "Hello" },
    ],
  };
}

function makeFlat(breadth: number): A2UISnapshot {
  const components: A2UIComponent[] = [
    {
      id: "root",
      component: "Column",
      children: Array.from({ length: breadth }, (_, i) => `t${i}`),
    },
  ];
  for (let i = 0; i < breadth; i++) {
    components.push({ id: `t${i}`, component: "Text", text: `item ${i}` });
  }
  return { surfaceId: "flat", components };
}

function makeDeep(depth: number): A2UISnapshot {
  const components: A2UIComponent[] = [];
  for (let i = 0; i < depth; i++) {
    components.push({
      id: i === 0 ? "root" : `c${i}`,
      component: "Card",
      child: i === depth - 1 ? "leaf" : `c${i + 1}`,
    });
  }
  components.push({ id: "leaf", component: "Text", text: "bottom" });
  return { surfaceId: "deep", components };
}

function makeMixed(total: number): A2UISnapshot {
  const components: A2UIComponent[] = [];
  const childIds: string[] = [];

  for (let i = 0; i < 4; i++) {
    const listId = `list${i}`;
    const tmplId = `tmpl${i}`;
    childIds.push(listId);
    components.push({
      id: listId,
      component: "List",
      children: { path: `/items${i}`, componentId: tmplId },
    });
    components.push({
      id: tmplId,
      component: "Card",
      child: `tmpl${i}_text`,
    });
    components.push({
      id: `tmpl${i}_text`,
      component: "Text",
      text: {
        call: "formatString",
        args: { value: "Item ${title} (${index})" },
      },
    });
  }

  let i = 0;
  while (components.length < total) {
    const colId = `col${i}`;
    childIds.push(colId);
    const text1 = `t${i}a`;
    const text2 = `t${i}b`;
    components.push({
      id: colId,
      component: "Column",
      children: [text1, text2],
    });
    components.push({
      id: text1,
      component: "Text",
      text: i % 3 === 0 ? { path: `/data/${i}` } : `static ${i}`,
    });
    components.push({
      id: text2,
      component: "Text",
      text:
        i % 5 === 0
          ? {
              call: "formatString",
              args: { value: `Row ${i}: \${/data/${i}}` },
            }
          : `static b ${i}`,
    });
    i++;
  }

  components.unshift({
    id: "root",
    component: "Column",
    children: childIds,
  });
  return { surfaceId: "mixed", components };
}

function makeBindingsHeavy(): A2UISnapshot {
  const components: A2UIComponent[] = [];
  const childIds: string[] = [];
  for (let i = 0; i < 200; i++) {
    const id = `t${i}`;
    childIds.push(id);
    components.push({
      id,
      component: "Text",
      text: {
        call: "formatString",
        args: {
          value: `\${/a/${i}} - \${/b/${i}} - \${/c/${i}}`,
        },
      },
    });
  }
  components.unshift({
    id: "root",
    component: "Column",
    children: childIds,
  });
  return { surfaceId: "bindings-heavy", components };
}

function makeTemplatesHeavy(): A2UISnapshot {
  const components: A2UIComponent[] = [];
  const childIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    const listId = `list${i}`;
    const tmplId = `tmpl${i}`;
    childIds.push(listId);
    components.push({
      id: listId,
      component: "List",
      children: { path: `/items${i}`, componentId: tmplId },
    });
    // 5-deep subtree under each template.
    components.push({ id: tmplId, component: "Card", child: `${tmplId}_1` });
    components.push({
      id: `${tmplId}_1`,
      component: "Column",
      child: `${tmplId}_2`,
    } as A2UIComponent);
    components.push({
      id: `${tmplId}_2`,
      component: "Card",
      child: `${tmplId}_3`,
    });
    components.push({
      id: `${tmplId}_3`,
      component: "Column",
      child: `${tmplId}_4`,
    } as A2UIComponent);
    components.push({
      id: `${tmplId}_4`,
      component: "Text",
      text: { path: "title" },
    });
  }
  components.unshift({
    id: "root",
    component: "Column",
    children: childIds,
  });
  return { surfaceId: "templates-heavy", components };
}

const fixtures = {
  tiny: makeTiny(),
  flat100: makeFlat(100),
  deep100: makeDeep(100),
  mixed1000: makeMixed(1000),
  bindingsHeavy: makeBindingsHeavy(),
  templatesHeavy: makeTemplatesHeavy(),
};

describe("a2ui adapter", () => {
  bench("tiny", () => {
    adaptA2UIToFlow(fixtures.tiny);
  });

  bench("flat-100", () => {
    adaptA2UIToFlow(fixtures.flat100);
  });

  bench("deep-100", () => {
    adaptA2UIToFlow(fixtures.deep100);
  });

  bench("mixed-1000", () => {
    adaptA2UIToFlow(fixtures.mixed1000);
  });

  bench("bindings-heavy", () => {
    adaptA2UIToFlow(fixtures.bindingsHeavy);
  });

  bench("templates-heavy", () => {
    adaptA2UIToFlow(fixtures.templatesHeavy);
  });
});
