import * as cdk from '@aws-cdk/core';

import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { CdkPipeline, SimpleSynthAction } from '@aws-cdk/pipelines';
import { SecretValue } from '@aws-cdk/core';
import { MyApplication } from './application';

export class CdkPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const pipeline = new CdkPipeline(this, 'Pipeline', {
      pipelineName: 'CdkPipeline',
      cloudAssemblyArtifact: cloudAssemblyArtifact,
      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager('GitHubCodePipelineToken'),
        trigger: codepipeline_actions.GitHubTrigger.POLL,
        owner: 'ericljiang',
        repo: 'cdk-test'
      }),
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact: sourceArtifact,
        cloudAssemblyArtifact: cloudAssemblyArtifact,
        buildCommand: 'npm run build' // Why is this needed?
      })
    });

    pipeline.addApplicationStage(new MyApplication(this, "ProdStage", "prod"));
  }
}
