import { describe, expect, test, vi } from "vitest";
import { synthesizeSchema } from "../schema";
import type { A2UIComponent } from "../types";
import type { Logger } from "@player-ui/player";

const component = (overrides: Partial<A2UIComponent>): A2UIComponent =>
  ({ id: "x", component: "TextField", ...overrides }) as A2UIComponent;

const mockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("synthesizeSchema", () => {
  test("returns undefined when no component has checks", () => {
    expect(
      synthesizeSchema([component({ text: { path: "/x" } })]),
    ).toBeUndefined();
  });

  test("TextField with [required, email] generates nested types and validation refs", () => {
    const schema = synthesizeSchema([
      component({
        id: "email_field",
        component: "TextField",
        text: { path: "/user/email" },
        checks: [
          { call: "required", message: "Email is required" },
          { call: "email", message: "Must be a valid email" },
        ],
      }),
    ]);

    expect(schema).toEqual({
      ROOT: { user: { type: "T_user" } },
      T_user: {
        email: {
          type: "string",
          validation: [
            {
              type: "required",
              message: "Email is required",
              severity: "error",
              trigger: "change",
            },
            {
              type: "email",
              message: "Must be a valid email",
              severity: "error",
              trigger: "change",
            },
          ],
        },
      },
    });
  });

  test("multiple inputs at different leaves share intermediate types", () => {
    const schema = synthesizeSchema([
      component({
        id: "first",
        text: { path: "/user/firstName" },
        checks: [{ call: "required", message: "first required" }],
      }),
      component({
        id: "last",
        text: { path: "/user/lastName" },
        checks: [{ call: "required", message: "last required" }],
      }),
    ]);

    expect(schema?.ROOT).toEqual({ user: { type: "T_user" } });
    expect(schema?.T_user).toMatchObject({
      firstName: {
        type: "string",
        validation: [{ type: "required", message: "first required" }],
      },
      lastName: {
        type: "string",
        validation: [{ type: "required", message: "last required" }],
      },
    });
  });

  test("regex check hoists pattern arg onto reference", () => {
    const schema = synthesizeSchema([
      component({
        text: { path: "/formData/zip" },
        checks: [
          {
            call: "regex",
            args: { pattern: "^[0-9]{5}$" },
            message: "5-digit zip",
          },
        ],
      }),
    ]);

    expect(schema?.T_formData).toMatchObject({
      zip: {
        validation: [
          {
            type: "regex",
            regex: "^[0-9]{5}$",
            message: "5-digit zip",
            severity: "error",
          },
        ],
      },
    });
  });

  test("length check hoists min/max", () => {
    const schema = synthesizeSchema([
      component({
        text: { path: "/name" },
        checks: [{ call: "length", args: { min: 2, max: 50 }, message: "len" }],
      }),
    ]);

    expect((schema?.ROOT.name as { validation: unknown[] }).validation).toEqual(
      [
        {
          type: "length",
          min: 2,
          max: 50,
          message: "len",
          severity: "error",
          trigger: "change",
        },
      ],
    );
  });

  test("CheckBox defaults leaf type to boolean", () => {
    const schema = synthesizeSchema([
      component({
        component: "CheckBox",
        checked: { path: "/agreed" },
        checks: [{ call: "required", message: "must agree" }],
      }),
    ]);
    expect((schema?.ROOT.agreed as { type: string }).type).toBe("boolean");
  });

  test("numeric check elevates leaf type to number", () => {
    const schema = synthesizeSchema([
      component({
        component: "Slider",
        value: { path: "/count" },
        checks: [{ call: "numeric", message: "must be numeric" }],
      }),
    ]);
    expect((schema?.ROOT.count as { type: string }).type).toBe("number");
  });

  test("unknown check call is dropped with a warning", () => {
    const logger = mockLogger();
    const schema = synthesizeSchema(
      [
        component({
          text: { path: "/x" },
          checks: [{ call: "supercheck", message: "??" }],
        }),
      ],
      logger,
    );
    expect(schema).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Unknown validation check 'supercheck'"),
    );
  });

  test("ambiguous binding (multiple {path} refs, no input prop match) is skipped", () => {
    const logger = mockLogger();
    const schema = synthesizeSchema(
      [
        {
          id: "weird",
          component: "CustomThing",
          a: { path: "/x" },
          b: { path: "/y" },
          checks: [{ call: "required", message: "?" }],
        } as A2UIComponent,
      ],
      logger,
    );
    expect(schema).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("multiple {path} refs"),
    );
  });
});
