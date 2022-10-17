import type { Config } from "jest";

const config: Config = {
  rootDir: "./src/",
  coverageThreshold: {
    global: { statements: 100, branches: 100, functions: 100, lines: 100 }
  }
};

export default config;
