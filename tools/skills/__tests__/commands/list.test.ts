import { describe, test, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { MOCK_SKILLS } from "../fixtures.js";

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
  mockRemoveSkillFiles,
  mockGetAllSkills,
  mockGetInstalledSkillIds,
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
    mockRemoveSkillFiles: vi.fn<() => Promise<void>>(),
    mockGetAllSkills: vi.fn(),
    mockGetInstalledSkillIds: vi.fn<(scope: string) => string[]>(),
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
  removeSkillFiles: mockRemoveSkillFiles,
}));

vi.mock("../../src/lib/skills.js", () => ({
  getAllSkills: mockGetAllSkills,
}));

vi.mock("../../src/lib/paths.js", () => ({
  getInstalledSkillIds: mockGetInstalledSkillIds,
  getSkillInstallPath: mockGetSkillInstallPath,
}));

import { registerListCommand } from "../../src/commands/list.js";

describe("registerListCommand", () => {
  let program: Command;

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetAllSkills.mockReturnValue(MOCK_SKILLS);
    mockGetInstalledSkillIds.mockReturnValue([]);
    mockGetSkillInstallPath.mockImplementation((id: string) => `/dest/${id}`);
    mockInstallSkillFiles.mockResolvedValue(undefined);
    mockRemoveSkillFiles.mockResolvedValue(undefined);
    mockSpinner.mockReturnValue({
      start: mockSpinnerStart,
      stop: mockSpinnerStop,
    });

    program = new Command();
    program.exitOverride();
    registerListCommand(program);
  });

  test("installs newly checked skills", async () => {
    mockGetInstalledSkillIds.mockReturnValue([]);
    mockSelect.mockResolvedValue("local");
    mockMultiselect.mockResolvedValue(["create-core-plugin"]);

    await program.parseAsync(["list"], { from: "user" });

    expect(mockInstallSkillFiles).toHaveBeenCalledWith(
      ["create-core-plugin"],
      MOCK_SKILLS,
      "local",
    );
    expect(mockRemoveSkillFiles).toHaveBeenCalledWith([], "local");
    expect(mockOutro).toHaveBeenCalledWith(
      expect.stringContaining("installed 1"),
    );
  });

  test("removes unchecked skills", async () => {
    mockGetInstalledSkillIds.mockReturnValue(["create-core-plugin"]);
    mockSelect.mockResolvedValue("local");
    mockMultiselect.mockResolvedValue([]);

    await program.parseAsync(["list"], { from: "user" });

    expect(mockRemoveSkillFiles).toHaveBeenCalledWith(
      ["create-core-plugin"],
      "local",
    );
    expect(mockInstallSkillFiles).toHaveBeenCalledWith(
      [],
      MOCK_SKILLS,
      "local",
    );
    expect(mockOutro).toHaveBeenCalledWith(
      expect.stringContaining("removed 1"),
    );
  });

  test("shows no changes message when selection is unchanged", async () => {
    mockGetInstalledSkillIds.mockReturnValue(["create-core-plugin"]);
    mockSelect.mockResolvedValue("local");
    mockMultiselect.mockResolvedValue(["create-core-plugin"]);

    await program.parseAsync(["list"], { from: "user" });

    expect(mockOutro).toHaveBeenCalledWith("No changes.");
    expect(mockInstallSkillFiles).not.toHaveBeenCalled();
    expect(mockRemoveSkillFiles).not.toHaveBeenCalled();
  });

  test("cancels when scope select is cancelled", async () => {
    mockSelect.mockResolvedValue(Symbol("cancel"));

    await program.parseAsync(["list"], { from: "user" });

    expect(mockCancel).toHaveBeenCalledWith("Cancelled.");
    expect(mockMultiselect).not.toHaveBeenCalled();
  });

  test("cancels when multiselect is cancelled", async () => {
    mockSelect.mockResolvedValue("global");
    mockMultiselect.mockResolvedValue(Symbol("cancel"));

    await program.parseAsync(["list"], { from: "user" });

    expect(mockCancel).toHaveBeenCalledWith("No changes made.");
    expect(mockInstallSkillFiles).not.toHaveBeenCalled();
    expect(mockRemoveSkillFiles).not.toHaveBeenCalled();
  });

  test("handles both install and remove in one operation", async () => {
    mockGetInstalledSkillIds.mockReturnValue(["player-hooks-guide"]);
    mockSelect.mockResolvedValue("global");
    mockMultiselect.mockResolvedValue(["create-core-plugin"]);

    await program.parseAsync(["list"], { from: "user" });

    expect(mockInstallSkillFiles).toHaveBeenCalledWith(
      ["create-core-plugin"],
      MOCK_SKILLS,
      "global",
    );
    expect(mockRemoveSkillFiles).toHaveBeenCalledWith(
      ["player-hooks-guide"],
      "global",
    );
    expect(mockOutro).toHaveBeenCalledWith(
      expect.stringContaining("installed 1"),
    );
    expect(mockOutro).toHaveBeenCalledWith(
      expect.stringContaining("removed 1"),
    );
  });

  test("does not remove skills that are not in the available list", async () => {
    // 'legacy-skill' is installed but not in MOCK_SKILLS — must be preserved
    mockGetInstalledSkillIds.mockReturnValue([
      "legacy-skill",
      "player-hooks-guide",
    ]);
    mockSelect.mockResolvedValue("local");
    mockMultiselect.mockResolvedValue([]);

    await program.parseAsync(["list"], { from: "user" });

    // Only player-hooks-guide (which IS in MOCK_SKILLS) should be removed;
    // legacy-skill must not be touched even though it is installed.
    expect(mockRemoveSkillFiles).toHaveBeenCalledOnce();
    expect(mockRemoveSkillFiles).toHaveBeenCalledWith(
      ["player-hooks-guide"],
      "local",
    );
    expect(mockRemoveSkillFiles).not.toHaveBeenCalledWith(
      expect.arrayContaining(["legacy-skill"]),
      expect.any(String),
    );
  });

  test("shows spinner during changes", async () => {
    mockGetInstalledSkillIds.mockReturnValue([]);
    mockSelect.mockResolvedValue("local");
    mockMultiselect.mockResolvedValue(["create-core-plugin"]);

    await program.parseAsync(["list"], { from: "user" });

    expect(mockSpinnerStart).toHaveBeenCalledWith("Applying changes…");
    expect(mockSpinnerStop).toHaveBeenCalledWith("Done.");
  });

  test("calls intro on start", async () => {
    mockSelect.mockResolvedValue(Symbol("cancel"));

    await program.parseAsync(["list"], { from: "user" });

    expect(mockIntro).toHaveBeenCalledWith("Player-UI Skills — Manage");
  });

  test("passes scope returned by select to getInstalledSkillIds", async () => {
    mockSelect.mockResolvedValue("global");
    mockMultiselect.mockResolvedValue([]);

    await program.parseAsync(["list"], { from: "user" });

    expect(mockGetInstalledSkillIds).toHaveBeenCalledWith("global");
  });
});
