import "server-only";

import { APP_PHASE, SOLANA_NETWORK } from "@/lib/runtime-config";

export function isMainnetLaunchAllowedOnServer() {
  if (SOLANA_NETWORK !== "mainnet-beta") return true;
  return (
    APP_PHASE === "mainnet" &&
    process.env.ENABLE_MAINNET_LAUNCHES === "true"
  );
}

export function getLaunchPolicyError() {
  if (isMainnetLaunchAllowedOnServer()) return null;
  return "Mainnet launches are disabled. This deployment is currently in a testnet safety phase.";
}

export function isEvmLaunchAllowedOnServer() {
  if (APP_PHASE !== "mainnet") return true;
  return (
    process.env.ENABLE_MAINNET_LAUNCHES === "true" &&
    process.env.ENABLE_EVM_LAUNCH_ADAPTERS === "true"
  );
}

export function getEvmLaunchPolicyError() {
  if (isEvmLaunchAllowedOnServer()) return null;
  return "EVM launches are disabled. Enable mainnet and EVM adapter gates explicitly.";
}
