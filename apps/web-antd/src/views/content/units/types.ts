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

// 定义从API读取的单位数据结构
export interface UnitRead {
  id: string;
  name: string;
  abbreviation?: string | null;
  plural_name?: string | null;
  ingredient_count: number;
  is_deleted: boolean;
  created_at: string;
}

// 定义创建单位时发送给API的数据结构
export interface UnitCreateData {
  name: string;
  abbreviation?: string | null;
  plural_name?: string | null;
}

// 定义更新单位时发送给API的数据结构
export type UnitUpdateData = Partial<UnitCreateData>;

// 定义合并单位时发送给API的数据结构
export interface UnitMergeData {
  source_unit_ids: string[];
  target_unit_id: string;
}

// 定义批量操作单位时发送给API的数据结构
export interface BatchDeleteUnitsPayload {
  unit_ids: string[];
}
