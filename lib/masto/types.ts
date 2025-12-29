import type { mastodon } from "masto";

type MastoClient = mastodon.rest.Client;
type Status = mastodon.v1.Status;
type CreateStatusParams = mastodon.rest.v1.CreateStatusParams;
type StatusVisibility = mastodon.v1.StatusVisibility;

export type { MastoClient, Status, CreateStatusParams, StatusVisibility };
