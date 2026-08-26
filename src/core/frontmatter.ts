/**
 * 极简 YAML frontmatter 解析：仅支持「key: value」单行标量，
 * 满足 SKILL.md 的 name / description 需求。
 */

const FENCE = "---";

/** 解析 frontmatter 为 key→value 映射；无 frontmatter 返回空对象 */
export function parseFrontmatter(md: string): Record<string, string> {
  const lines = md.split(/\r?\n/);
  if (lines[0]?.trim() !== FENCE) return {};

  const result: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim() === FENCE) return result;
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const rawValue = line.slice(idx + 1).trim();
    result[key] = unquote(rawValue);
  }
  return result;
}

/** 去掉 frontmatter，返回正文（含开头空行，保持原文） */
export function stripFrontmatter(md: string): string {
  const lines = md.split(/\r?\n/);
  if (lines[0]?.trim() !== FENCE) return md;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]!.trim() === FENCE) {
      return lines.slice(i + 1).join("\n");
    }
  }
  // 只有开头 fence 没有闭合：视为无 frontmatter
  return md;
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/** 转为 YAML 双引号标量，安全嵌入描述文本 */
export function yamlQuote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
