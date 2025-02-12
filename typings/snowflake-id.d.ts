declare module "snowflake-id" {
  class SnowflakeId {
    constructor(options?: { mid?: number; offset?: number });
    generate(): string;
  }
  export = SnowflakeId;
}
