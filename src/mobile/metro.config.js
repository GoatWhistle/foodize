const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, "../shared");
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

const INSTANCE_OVERRIDES = {
  "@shared/services/api.instance": path.resolve(projectRoot, "src/services/api.ts"),
  "@shared/store/useAuthStore.instance": path.resolve(projectRoot, "src/store/useAuthStore.ts"),
  "@shared/store/useCartStore.instance": path.resolve(projectRoot, "src/store/useCartStore.ts"),
  "@shared/store/useOrdersStore.instance": path.resolve(
    projectRoot,
    "src/store/useOrdersStore.ts",
  ),
};

config.watchFolders = [sharedRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const override = INSTANCE_OVERRIDES[moduleName];
  if (override) {
    return context.resolveRequest(context, override, platform);
  }
  if (moduleName === "@shared") {
    return context.resolveRequest(context, sharedRoot, platform);
  }
  if (moduleName.startsWith("@shared/")) {
    const subPath = moduleName.slice("@shared/".length);
    return context.resolveRequest(context, path.join(sharedRoot, subPath), platform);
  }
  if (moduleName === "@" || moduleName.startsWith("@/")) {
    const subPath = moduleName === "@" ? "" : moduleName.slice("@/".length);
    return context.resolveRequest(context, path.join(projectRoot, "src", subPath), platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
