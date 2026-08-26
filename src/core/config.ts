import { readFile } from "node:fs/promises";
import { basename } from "node:path";

export const TOOL_IDS = ["codex", "claude", "cursor", "trae"] as const;
export type ToolId = (typeof TOOL_IDS)[number];

export interface SkillsConfig {
  /** 勾选的分类（rules/ 下的一级目录名） */
  categories: string[];
  /** 目标工具 */
  tools: ToolId[];
  /** 排除的 skill 名称 */
  exclude?: string[];
  /** 源仓库 URL 或本地路径（默认用内置仓库） */
  source?: string;
}

export const CONFIG_FILENAME = "skills.config.json";

/** 读取并校验 skills.config.json，失败时抛出含修复指引的错误 */
export async function loadConfig(configPath: string): Promise<SkillsConfig> {
  let raw: string;
  try {
    raw = await readFile(configPath, "utf-8");
  } catch {
    throw new Error(
      `未找到配置文件 ${basename(configPath)}。` +
        `请先在项目根目录创建（字段：categories / tools / exclude），` +
        `例如：{"categories": ["common", "frontend", "vue"], "tools": ["codex", "claude", "cursor", "trae"]}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`${CONFIG_FILENAME} 不是合法 JSON：${(e as Error).message}`);
  }

  return validateConfig(parsed);
}

export function validateConfig(raw: unknown): SkillsConfig {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`${CONFIG_FILENAME} 顶层必须是对象`);
  }
  const obj = raw as Record<string, unknown>;
  const errors: string[] = [];

  const categories = validateStringArray(obj.categories, "categories");
  if (categories.length === 0) errors.push("categories 必须是非空字符串数组");
  for (const c of categories) {
    if (!/^[a-z][a-z0-9-]*$/.test(c)) {
      errors.push(`分类名 ${JSON.stringify(c)} 不合法，须为 kebab-case`);
    }
  }

  const toolsRaw = validateStringArray(obj.tools, "tools");
  const tools: ToolId[] = [];
  for (const t of toolsRaw) {
    if (!(TOOL_IDS as readonly string[]).includes(t)) {
      errors.push(`未知工具 ${JSON.stringify(t)}，可选值：${TOOL_IDS.join(" / ")}`);
    } else {
      tools.push(t as ToolId);
    }
  }
  if (tools.length === 0) errors.push("tools 必须是非空字符串数组");

  let exclude: string[] | undefined;
  if (obj.exclude !== undefined) {
    exclude = validateStringArray(obj.exclude, "exclude");
    if (exclude.length === 0) errors.push("exclude 若提供则须为非空字符串数组");
  }

  let source: string | undefined;
  if (obj.source !== undefined) {
    if (typeof obj.source !== "string" || obj.source.trim() === "") {
      errors.push("source 若提供则须为非空字符串（git URL 或本地路径）");
    } else {
      source = obj.source.trim();
    }
  }

  const knownKeys = new Set(["categories", "tools", "exclude", "source"]);
  for (const key of Object.keys(obj)) {
    if (!knownKeys.has(key)) errors.push(`未知字段 ${JSON.stringify(key)}`);
  }

  if (errors.length > 0) {
    throw new Error(`${CONFIG_FILENAME} 校验失败：\n  - ${errors.join("\n  - ")}`);
  }

  return { categories, tools, ...(exclude ? { exclude } : {}), ...(source ? { source } : {}) };
}

function validateStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    throw new Error(`${CONFIG_FILENAME} 校验失败：\n  - ${field} 必须是字符串数组`);
  }
  return value as string[];
}
