/**
 * @description 用于从API读取的单位数据模型。
 * 字段应与后端 Pydantic 的 UnitRead schema 完全匹配。
 */
export interface UnitRead {
  id: string; // UUID 在前端是字符串
  name: string;
  abbreviation?: string | null;
  plural_name?: string | null;
}

/**
 * @description 创建新单位时，发送给API的数据模型。
 * 字段应与后端 Pydantic 的 UnitCreate schema 完全匹配。
 */
export interface UnitCreate {
  name: string;
  abbreviation?: string | null;
  plural_name?: string | null;
}

/**
 * @description 更新单位时，发送给API的数据模型。
 * 字段应与后端 Pydantic 的 UnitUpdate schema 完全匹配。
 */
export interface UnitUpdate {
  name?: string;
  abbreviation?: string | null;
  plural_name?: string | null;
}
