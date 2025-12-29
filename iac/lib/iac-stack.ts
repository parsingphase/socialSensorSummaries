import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import { Duration, type StackProps } from "aws-cdk-lib";
import * as Events from "aws-cdk-lib/aws-events";
import * as Targets from "aws-cdk-lib/aws-events-targets";
import * as Lambda from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";
import { config } from "../../config/config";

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
	constructor(
		scope: Construct,
		id: string,
		deployEnv: "prod" | "dev",
		props?: StackProps,
	) {
		super(scope, id, props);
		const lambdaEnv = config.lambda[deployEnv];

		// MASTODON
		const mastoConfig = {
			MASTO_CLIENT_TOKEN: config.mastodon.apiClientToken,
			MASTO_BASE_URL: config.mastodon.apiBaseUrl,
		};

		const mastoDockerLambdaFunction = this.buildDockerLambda(
			deployEnv,
			`DailyYardSummaryLambdaMastoDocker`,
			`daily-yard-summary-lambda-masto-docker-${deployEnv}`,
			`${__dirname}/../../Dockerfile-masto-lambda`,
			mastoConfig,
		);

		const mastoPostSchedule = lambdaEnv.postSchedule;
		const mastoEventRule = new Events.Rule(
			this,
			"DailyYardSummaryScheduleRule",
			{
				schedule: Events.Schedule.cron(mastoPostSchedule),
				enabled: lambdaEnv.enable,
			},
		);

		// void mastoLambdaFunction;
		mastoEventRule.addTarget(
			new Targets.LambdaFunction(mastoDockerLambdaFunction),
		);

		// Bluesky
		const blueskyConfig = {
			BLUESKY_USERNAME: config.blueSky.username,
			BLUESKY_PASSWORD: config.blueSky.password,
			BLUESKY_BASE_URL: config.blueSky.serviceUrl,
		};

		const blueskyDockerLambdaFunction = this.buildDockerLambda(
			deployEnv,
			`DailyYardSummaryLambdaBlueskyDocker`,
			`daily-yard-summary-lambda-bluesky-docker-${deployEnv}`,
			`${__dirname}/../../Dockerfile-bluesky-lambda`,
			blueskyConfig,
		);

		const bluePostSchedule = lambdaEnv.postSchedule;
		bluePostSchedule.minute = `${Number(bluePostSchedule.minute) + 2}`; // offset to support AWN bandwidth
		const blueEventRule = new Events.Rule(
			this,
			"DailyYardSummaryScheduleRuleBluesky",
			{
				schedule: Events.Schedule.cron(bluePostSchedule),
				enabled: lambdaEnv.enable,
			},
		);

		// void blueskyLambdaFunction;
		blueEventRule.addTarget(
			new Targets.LambdaFunction(blueskyDockerLambdaFunction),
		);
	}

	private buildDockerLambda(
		deployEnv: "prod" | "dev",
		lambdaResourceId: string,
		lambdaFunctionName: string,
		lambdaAssetPath: string,
		serviceConfig: {
			[key: string]: string;
		},
	): Lambda.Function {
		const { haikubox, ambientWeather, location, lambda, birdWeather } = config;
		const lambdaEnv = lambda[deployEnv];

		const dockerDir = path.dirname(lambdaAssetPath);
		const dockerFile = path.basename(lambdaAssetPath);

		const lambdaFunction = new Lambda.DockerImageFunction(
			this,
			lambdaResourceId,
			{
				functionName: lambdaFunctionName,
				code: Lambda.DockerImageCode.fromImageAsset(dockerDir, {
					assetName: dockerFile,
					file: dockerFile,
				}),
				memorySize: 512,
				timeout: Duration.seconds(30),
				environment: {
					...serviceConfig,

					POST_VISIBILITY: lambdaEnv.postVisibility,

					HAIKU_BASE_URL: haikubox.apiBaseUrl,
					HAIKU_SERIAL_NUMBER: haikubox.serialNumber,

					BIRDWEATHER_BASE_URL: birdWeather.apiBaseUrl,
					BIRDWEATHER_STATION_ID: `${birdWeather.stationId}`,

					AWN_BASE_URL: ambientWeather.apiBaseUrl,
					AWN_API_KEY: ambientWeather.apiKey,
					AWN_APPLICATION_KEY: ambientWeather.applicationKey,
					AWN_DEVICE_MAC: ambientWeather.deviceMac,

					SITE_LATITUDE: `${location.latitude}`,
					SITE_LONGITUDE: `${location.longitude}`,
				},
			},
		);

		new cdk.CfnOutput(this, `${lambdaFunctionName}Name`, {
			value: lambdaFunction.functionName,
		});
		return lambdaFunction;
	}
}
