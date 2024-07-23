import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as Lambda from "aws-cdk-lib/aws-lambda";
import { Duration, StackProps } from "aws-cdk-lib";
import { config } from "../../config/config";
import * as Events from "aws-cdk-lib/aws-events";
import * as Targets from "aws-cdk-lib/aws-events-targets";

/**
 * Upper-case first letter
 * @param text
 */
export function ucFirst(text: string): string {
  if (text.length === 0) {
    return text;
  }
  return text[0].toUpperCase() + text.substring(1);
}

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, deployEnv: "prod" | "dev", props?: StackProps) {
    super(scope, id, props);

    const lambdaAssetPath = `${__dirname}/../../build/output/lambda.zip`;

    const { mastodon, haikubox, lambda } = config;

    const lambdaEnv = lambda[deployEnv];

    const lambdaFunction = new Lambda.Function(this, `DailyYardSummaryLambda`, {
      functionName: `daily-yard-summary-lambda-${deployEnv}`,
      runtime: Lambda.Runtime.NODEJS_18_X,
      handler: "lambda.handler",
      code: Lambda.Code.fromAsset(lambdaAssetPath),
      memorySize: 512,
      timeout: Duration.seconds(30),
      environment: {
        MASTO_CLIENT_TOKEN: mastodon.apiClientToken,
        MASTO_BASE_URL: mastodon.apiBaseUrl,
        POST_VISIBILITY: lambdaEnv.postVisibility,
        HAIKU_BASE_URL: haikubox.apiBaseUrl,
        HAIKU_SERIAL_NUMBER: haikubox.serialNumber,
      },
    });

    new cdk.CfnOutput(this, "LamdbaName", {
      value: lambdaFunction.functionName,
    });

    const postSchedule = lambdaEnv.postSchedule;
    const eventRule = new Events.Rule(this, "DailyYardSummaryScheduleRule", {
      schedule: Events.Schedule.cron(postSchedule),
      enabled: lambdaEnv.enable,
    });
    eventRule.addTarget(new Targets.LambdaFunction(lambdaFunction));
  }
}
