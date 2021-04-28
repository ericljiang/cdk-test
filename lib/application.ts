import { Construct, Stack, StackProps, Stage, StageProps } from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigatewayv2";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import { LambdaWebSocketIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";

export class MyApplication extends Stage {
  constructor(scope: Construct, id: string, stageName: string, props?: StageProps) {
    super(scope, id, props);
    new MyStack(this, stageName, 'ApplicationStack');
  }
}

class MyStack extends Stack {
  constructor(scope: Construct, id: string, stageName: string, props?: StackProps) {
    super(scope, id, props);

    const connectionsTable = new dynamodb.Table(this, "Connections", {
      partitionKey: { name: "connectionId", type: dynamodb.AttributeType.STRING }
    });

    const onConnectFunction = new lambda.Function(this, "OnConnect", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("asset/on-connect"),
      handler: "index.handler"
    }).addEnvironment("TABLE_NAME", connectionsTable.tableName);;
    const onDisconnectFunction = new lambda.Function(this, "OnDisconnect", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("asset/on-disconnect"),
      handler: "index.handler"
    }).addEnvironment("TABLE_NAME", connectionsTable.tableName);;
    const pushGameEventFunction = new lambda.Function(this, "PushGameEvent", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("asset/push-game-event"),
      handler: "index.handler"
    }).addEnvironment("TABLE_NAME", connectionsTable.tableName);;

    connectionsTable.grantWriteData(onConnectFunction);
    connectionsTable.grantWriteData(onDisconnectFunction);
    connectionsTable.grantReadData(pushGameEventFunction);

    const webSocketApi = new apigateway.WebSocketApi(this, "WebSocketApi", {
      connectRouteOptions: { integration: new LambdaWebSocketIntegration({ handler: onConnectFunction }) },
      disconnectRouteOptions: { integration: new LambdaWebSocketIntegration({ handler: onDisconnectFunction }) }
    });

    new apigateway.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi: webSocketApi,
      stageName: stageName,
      autoDeploy: true
    });
  }
}
