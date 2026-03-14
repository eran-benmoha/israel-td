import { defineConfig } from "vite";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const pagesBase = repoName ? `/${repoName}/` : "/";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? pagesBase : "/",
});
