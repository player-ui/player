import { describe, test, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { MOCK_SKILLS } from "../fixtures.js";

// vi.hoisted ensures these are initialized before vi.mock() factories run
const {
  mockIntro,
  mockOutro,
  mockMultiselect,
  mockSelect,
  mockSpinnerStart,
  mockSpinnerStop,
  mockSpinner,
  mockCancel,
  mockInstallSkillFiles,
  mockGetAllSkills,
  mockGetSkillInstallPath,
} = vi.hoisted(() => {
  const mockSpinnerStart = vi.fn();
  const mockSpinnerStop = vi.fn();
  return {
    mockIntro: vi.fn(),
    mockOutro: vi.fn(),
    mockMultiselect: vi.fn<() => Promise<string[] | symbol>>(),
    mockSelect: vi.fn<() => Promise<string | symbol>>(),
    mockSpinnerStart,
    mockSpinnerStop,
    mockSpinner: vi.fn(() => ({
      start: mockSpinnerStart,
      stop: mockSpinnerStop,
    })),
    mockCancel: vi.fn(),
    mockInstallSkillFiles: vi.fn<() => Promise<void>>(),
    mockGetAllSkills: vi.fn(),
    mockGetSkillInstallPath: vi.fn<(id: string, scope: string) => string>(),
  };
});

vi.mock("@clack/prompts", () => ({
  intro: mockIntro,
  outro: mockOutro,
  multiselect: mockMultiselect,
  select: mockSelect,
  spinner: mockSpinner,
  cancel: mockCancel,
  isCancel: (v: unknown): v is symbol => typeof v === "symbol",
}));

vi.mock("../../src/lib/installer.js", () => ({
  installSkillFiles: mockInstallSkillFiles,
}));

vi.mock("../../src/lib/skills.js", () => ({
  getAllSkills: mockGetAllSkills,
}));

vi.mock("../../src/lib/paths.js", () => ({
  getSkillInstallPath: mockGetSkillInstallPath,
  getInstalledSkillIds: vi.fn(() => []),
}));

import { registerInstallCommand } from "../../src/commands/install.js";

describe("registerInstallCommand", () => {
  let program: Command;

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetAllSkills.mockReturnValue(MOCK_SKILLS);
    mockGetSkillInstallPath.mockImplementation((id: string) => `/dest/${id}`);
    mockInstallSkillFiles.mockResolvedValue(undefined);
    mockSpinner.mockReturnValue({
      start: mockSpinnerStart,
      stop: mockSpinnerStop,
    });

    program = new Command();
    program.exitOverride();
    registerInstallCommand(program);
  });

  test("installs selected skills to local scope", async () => {
    mockMultiselect.mockResolvedValue(["create-core-plugin"]);
    mockSelect.mockResolvedValue("local");

    await program.parseAsync(["install"], { from: "user" });

    expect(mockInstallSkillFiles).toHaveBeenCalledWith(
      ["create-core-plugin"],
      MOCK_SKILLS,
      "local",
    );
    expect(mockOutro).toHaveBeenCalledWith(
      expect.stringContaining(".claude/skills/"),
    );
  });

  test("installs multiple skills to global scope", async () => {
    mockMultiselect.mockResolvedValue([
      "create-core-plugin",
      "player-hooks-guide",
    ]);
    mockSelect.mockResolvedValue("global");

    await program.parseAsync(["install"], { from: "user" });

    expect(mockInstallSkillFiles).toHaveBeenCalledWith(
      ["create-core-plugin", "player-hooks-guide"],
      MOCK_SKILLS,
      "global",
    );
    expect(mockOutro).toHaveBeenCalledWith(expect.stringContaining("globally"));
  });

  test("skips scope prompt and shows 'No skills selected' when selection is empty", async () => {
    mockMultiselect.mockResolvedValue([]);

    await program.parseAsync(["install"], { from: "user" });

    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockInstallSkillFiles).not.toHaveBeenCalled();
    expect(mockOutro).toHaveBeenCalledWith("No skills selected.");
  });

  test("cancels and does not install when multiselect is cancelled", async () => {
    mockMultiselect.mockResolvedValue(Symbol("cancel"));

    await program.parseAsync(["install"], { from: "user" });

    expect(mockCancel).toHaveBeenCalledWith("Installation cancelled.");
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockInstallSkillFiles).not.toHaveBeenCalled();
  });

  test("cancels and does not install when scope select is cancelled", async () => {
    mockMultiselect.mockResolvedValue(["create-core-plugin"]);
    mockSelect.mockResolvedValue(Symbol("cancel"));

    await program.parseAsync(["install"], { from: "user" });

    expect(mockCancel).toHaveBeenCalledWith("Installation cancelled.");
    expect(mockInstallSkillFiles).not.toHaveBeenCalled();
  });

  test("shows spinner during installation", async () => {
    mockMultiselect.mockResolvedValue(["create-core-plugin"]);
    mockSelect.mockResolvedValue("local");

    await program.parseAsync(["install"], { from: "user" });

    expect(mockSpinnerStart).toHaveBeenCalledWith("Installing skills…");
    expect(mockSpinnerStop).toHaveBeenCalledWith("Installed 1 skill(s).");
  });

  test("calls intro on start", async () => {
    mockMultiselect.mockResolvedValue(Symbol("cancel"));

    await program.parseAsync(["install"], { from: "user" });

    expect(mockIntro).toHaveBeenCalledWith("Player-UI Skills — Install");
  });
});
