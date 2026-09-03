// RELEASE_TYPE forces the bump instead of deriving it from the commits.
const forced = process.env.RELEASE_TYPE;
const forcedBump = forced && forced !== "auto" ? forced : null;

export default {
  branches: ["main"],
  plugins: [
    forcedBump
      ? { analyzeCommits: () => forcedBump }
      : [
          "@semantic-release/commit-analyzer",
          { preset: "conventionalcommits" },
        ],

    "./scripts/release/notes.mjs",

    [
      "@semantic-release/exec",
      {
        verifyReleaseCmd:
          "node scripts/release/emit-version.mjs ${nextRelease.version}",
        prepareCmd:
          "node scripts/release/apply-version.mjs ${nextRelease.version}",
      },
    ],

    ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],

    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "charts/kaneo/Chart.yaml"],
        message:
          "chore(release): v${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],

    [
      "@semantic-release/github",
      {
        // This fork's history carries upstream's "Merge pull request #NNNN"
        // commits. Commenting on them looks the numbers up in *this* repo,
        // where they do not exist, and the 404 fails the release after the
        // tag and GitHub Release have already been published.
        successComment: false,
        failComment: false,
        failTitle: false,
      },
    ],
  ],
};
