import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",

      // PREVENT LEGACY PERMISSION FUNCTION USAGE - Added after Enhanced Entitlements Migration
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["**/auth*"],
              "importNames": ["isClubAdmin", "isClubLead"],
              "message": "🚨 LEGACY FUNCTION: Use entitlements system instead: getUserEntitlements, canManageClub, canModerateClub"
            },
            {
              "group": ["**/permissions*"],
              "importNames": ["isClubLead"],
              "message": "🚨 LEGACY FUNCTION: Use hasContextualEntitlement or canManageClub instead of isClubLead"
            }
          ]
        }
      ],

      // ENFORCE ENTITLEMENTS SYSTEM USAGE
      "no-restricted-syntax": [
        "error",
        {
          "selector": "CallExpression[callee.name='isClubAdmin']",
          "message": "🚨 LEGACY FUNCTION: Use canManageClub from entitlements system instead of isClubAdmin"
        },
        {
          "selector": "CallExpression[callee.name='isClubLead']",
          "message": "🚨 LEGACY FUNCTION: Use hasContextualEntitlement or canManageClub instead of isClubLead"
        },
        {
          "selector": "MemberExpression[object.name='useAuth'][property.name='isAdmin']",
          "message": "🚨 LEGACY PATTERN: Use useCanManageClub hook from entitlements system instead of isAdmin from AuthContext"
        }
      ],
    },
  }
);
