/**
Copyright 2022 Amazon.com, Inc. and its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at

  http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.
*/

import { GlueClient, GetJobRunCommand } from "@aws-sdk/client-glue";
import { fromEnv } from "@aws-sdk/credential-providers";
import { AppSyncClient } from "./appsync";

const glue = new GlueClient({ region: process.env.AWS_REGION });
const appSync = new AppSyncClient({
  graphQlUrl: process.env.APPSYNC_GRAPHQL_URL!,
  credentials: fromEnv(),
});

/**
 * Builds response before sending back to UI
 * @param http_code
 * @param body
 */
function build_response(http_code: number, body: any) {
  return {
    headers: {
      "Cache-Control": "no-cache, no-store", // tell cloudfront and api gateway not to cache the response
      "Content-Type": "application/json",
    },
    statusCode: http_code,
    body: JSON.stringify(body),
  };
}

/**
 * Import training dataset into Forecast
 * @param event
 * @param context
 */
export async function handler(event?: any, context?: any) {
  let data: String[] = [];

  try {
    const postProcId = event["detail"]["jobRunId"];

    const run = await glue.send(
      new GetJobRunCommand({
        JobName: process.env.POST_PROCESSOR_NAME,
        RunId: postProcId,
      })
    );

    const outputPath = run.JobRun?.Arguments?.["--output_path"]!;
    const pipeId = outputPath.split("/")[1];

    // Update pipeline info in ddb table
    await appSync.post({
      query: `mutation MyMutation($input: PipelineRequestInput!) {
        pipeline(input: $input) { Id PipelineStatus StatusUpdatedAt }
      }`,
      variables: {
        input: {
          Id: pipeId,
          PipelineStatus: process.env.PIPELINE_STATUS,
          StatusUpdatedAt: new Date().toISOString(),
        },
      },
    });
    data.push(`Pipeline status updated to ${process.env.PIPELINE_STATUS}`);

    return build_response(200, data);
  } catch (err) {
    console.error(err);
    data.push("Server Error");

    return build_response(500, data);
  }
}
