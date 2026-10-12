/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-cross-module-internal-imports",
      comment: "Modules may only import other modules via their public index.js interface",
      severity: "error",
      from: {
        path: "^src/modules/([^/]+)/"
      },
      to: {
        path: "^src/modules/([^/]+)/",
        pathNot: [
          "^src/modules/$1/",                 // own module internals allowed
          "^src/modules/[^/]+/index\\.js$"    // public module index allowed
        ]
      }
    },
    {
      name: "shared-cannot-import-modules",
      comment: "Shared code must not depend on business modules",
      severity: "error",
      from: {
        path: "^src/shared/"
      },
      to: {
        path: "^src/modules/"
      }
    },
    {
      name: "nothing-imports-main",
      comment: "Composition root (src/main) must not be imported by anyone",
      severity: "error",
      from: {
        path: "^src/(modules|shared|bin)/"
      },
      to: {
        path: "^src/main/"
      }
    },
    {
      name: "domain-is-pure",
      comment: "Domain layer must not depend on api, infrastructure, or external web frameworks",
      severity: "error",
      from: {
        path: "^src/modules/[^/]+/domain/"
      },
      to: {
        path: [
          "^src/modules/[^/]+/(api|infrastructure)/",
          "^node_modules/(fastify|@prisma)"
        ]
      }
    }
  ],
  options: {
    doNotFollow: {
      path: "node_modules"
    },
    tsPreCompilationDeps: false
  }
};
