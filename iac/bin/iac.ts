#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { IacStack, ucFirst } from "../lib/iac-stack";
import { config } from "../../config/config";

const { account, region } = config.cdk;

const deployEnv = process.env.DEPLOY_ENV || "dev";

if (deployEnv !== "dev" && deployEnv !== "prod") {
  throw new Error("DEPLOY_ENV must be one of prod,dev");
}

const stackId = "DailyYardSummary" + ucFirst(deployEnv);
console.log(`Deploy to ${stackId}`);

const app = new cdk.App();
new IacStack(app, stackId, deployEnv, {
  env: { account, region },
});
