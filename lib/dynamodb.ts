import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type { LinkRecord } from "@/types/bucket";

export type { LinkRecord };

function getConfig() {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  const region = process.env.AWS_REGION || "eu-west-2";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!tableName)
    throw new Error("DYNAMODB_TABLE_NAME environment variable is required");
  if (!accessKeyId)
    throw new Error("AWS_ACCESS_KEY_ID environment variable is required");
  if (!secretAccessKey)
    throw new Error("AWS_SECRET_ACCESS_KEY environment variable is required");

  return { tableName, region, accessKeyId, secretAccessKey };
}

function getClient() {
  const { region, accessKeyId, secretAccessKey } = getConfig();

  const client = new DynamoDBClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
}

export async function putLink(
  shortCode: string,
  longUrl: string,
): Promise<LinkRecord> {
  const { tableName } = getConfig();
  const client = getClient();
  const now = new Date().toISOString();

  const existing = await getLink(shortCode);
  if (existing) {
    throw new Error("shortCode already exists");
  }

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      shortCode,
      longUrl,
      createdAt: now,
    },
  });

  await client.send(command);

  return { shortCode, longUrl, createdAt: now };
}

export async function putLinkOverwrite(
  shortCode: string,
  longUrl: string,
): Promise<LinkRecord> {
  const { tableName } = getConfig();
  const client = getClient();
  const now = new Date().toISOString();

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      shortCode,
      longUrl,
      createdAt: now,
    },
  });

  await client.send(command);

  return { shortCode, longUrl, createdAt: now };
}

export async function getLink(shortCode: string): Promise<LinkRecord | null> {
  const { tableName } = getConfig();
  const client = getClient();

  const command = new GetCommand({
    TableName: tableName,
    Key: {
      shortCode,
    },
  });

  const response = await client.send(command);

  if (!response.Item) {
    return null;
  }

  return {
    shortCode: response.Item.shortCode as string,
    longUrl: response.Item.longUrl as string,
    createdAt: response.Item.createdAt as string,
  };
}

export async function listLinks(): Promise<LinkRecord[]> {
  const { tableName } = getConfig();
  const client = getClient();

  const command = new ScanCommand({
    TableName: tableName,
  });

  const response = await client.send(command);

  const items = (response.Items ?? []).map((item) => ({
    shortCode: item.shortCode as string,
    longUrl: item.longUrl as string,
    createdAt: item.createdAt as string,
  }));

  // Sort by createdAt descending
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function deleteLink(shortCode: string): Promise<void> {
  const { tableName } = getConfig();
  const client = getClient();

  const command = new DeleteCommand({
    TableName: tableName,
    Key: {
      shortCode,
    },
  });

  await client.send(command);
}
