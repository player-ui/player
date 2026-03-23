import { describe, test, expect, vi, beforeEach } from "vitest";

const { mockMkdir, mockCopyFile, mockRm, mockGetSkillInstallPath } = vi.hoisted(
  () => ({
    mockMkdir: vi.fn<() => Promise<void>>(),
    mockCopyFile: vi.fn<() => Promise<void>>(),
    mockRm: vi.fn<() => Promise<void>>(),
    mockGetSkillInstallPath: vi.fn<(id: string, scope: string) => string>(),
  }),
);

vi.mock("fs/promises", () => ({
  mkdir: mockMkdir,
  copyFile: mockCopyFile,
  rm: mockRm,
}));

vi.mock("../../src/lib/paths.js", () => ({
  getSkillInstallPath: mockGetSkillInstallPath,
}));

import {
  installSkillFiles,
  removeSkillFiles,
} from "../../src/lib/installer.js";
import { MOCK_SKILLS } from "../fixtures.js";

describe("installSkillFiles", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetSkillInstallPath.mockImplementation((id: string) => `/dest/${id}`);
    mockMkdir.mockResolvedValue(undefined);
    mockCopyFile.mockResolvedValue(undefined);
  });

  test("creates destination directory and copies SKILL.md", async () => {
    await installSkillFiles(["create-core-plugin"], MOCK_SKILLS, "local");

    expect(mockMkdir).toHaveBeenCalledWith("/dest/create-core-plugin", {
      recursive: true,
    });
    expect(mockCopyFile).toHaveBeenCalledWith(
      "/bundled/skills/create-core-plugin/SKILL.md",
      "/dest/create-core-plugin/SKILL.md",
    );
  });

  test("installs multiple skills in order", async () => {
    await installSkillFiles(
      ["create-core-plugin", "player-hooks-guide"],
      MOCK_SKILLS,
      "global",
    );

    expect(mockMkdir).toHaveBeenCalledTimes(2);
    expect(mockCopyFile).toHaveBeenCalledTimes(2);
    expect(mockGetSkillInstallPath).toHaveBeenCalledWith(
      "create-core-plugin",
      "global",
    );
    expect(mockGetSkillInstallPath).toHaveBeenCalledWith(
      "player-hooks-guide",
      "global",
    );
  });

  test("skips skills not present in the skills list", async () => {
    await installSkillFiles(["unknown-id"], MOCK_SKILLS, "local");

    expect(mockMkdir).not.toHaveBeenCalled();
    expect(mockCopyFile).not.toHaveBeenCalled();
  });

  test("does nothing for an empty skill ID list", async () => {
    await installSkillFiles([], MOCK_SKILLS, "local");

    expect(mockMkdir).not.toHaveBeenCalled();
    expect(mockCopyFile).not.toHaveBeenCalled();
  });

  test("passes scope to getSkillInstallPath", async () => {
    await installSkillFiles(["create-core-plugin"], MOCK_SKILLS, "global");

    expect(mockGetSkillInstallPath).toHaveBeenCalledWith(
      "create-core-plugin",
      "global",
    );
  });
});

describe("removeSkillFiles", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetSkillInstallPath.mockImplementation((id: string) => `/dest/${id}`);
    mockRm.mockResolvedValue(undefined);
  });

  test("removes the skill directory recursively", async () => {
    await removeSkillFiles(["create-core-plugin"], "local");

    expect(mockRm).toHaveBeenCalledWith("/dest/create-core-plugin", {
      recursive: true,
      force: true,
    });
  });

  test("removes multiple skills", async () => {
    await removeSkillFiles(
      ["create-core-plugin", "player-hooks-guide"],
      "global",
    );

    expect(mockRm).toHaveBeenCalledTimes(2);
    expect(mockGetSkillInstallPath).toHaveBeenCalledWith(
      "create-core-plugin",
      "global",
    );
    expect(mockGetSkillInstallPath).toHaveBeenCalledWith(
      "player-hooks-guide",
      "global",
    );
  });

  test("does nothing for an empty skill ID list", async () => {
    await removeSkillFiles([], "local");

    expect(mockRm).not.toHaveBeenCalled();
  });

  test("passes scope to getSkillInstallPath", async () => {
    await removeSkillFiles(["create-core-plugin"], "global");

    expect(mockGetSkillInstallPath).toHaveBeenCalledWith(
      "create-core-plugin",
      "global",
    );
  });
});
