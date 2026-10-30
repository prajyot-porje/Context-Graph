-- Generated from the version-matched auth snapshot; preserves existing identities.
BEGIN;




create table if not exists "jwks" ("id" text not null primary key, "publicKey" text not null, "privateKey" text not null, "createdAt" timestamptz not null, "expiresAt" timestamptz, "alg" text, "crv" text);

create table if not exists "oauthClient" ("id" text not null primary key, "clientId" text not null unique, "clientSecret" text, "clientDiscoveryId" text, "disabled" boolean, "skipConsent" boolean, "enableEndSession" boolean, "subjectType" text, "scopes" jsonb, "clientCredentialsScopes" jsonb, "userId" text references "user" ("id") on delete cascade, "createdAt" timestamptz, "updatedAt" timestamptz, "name" text, "uri" text, "icon" text, "contacts" jsonb, "tos" text, "policy" text, "softwareId" text, "softwareVersion" text, "softwareStatement" text, "redirectUris" jsonb not null, "postLogoutRedirectUris" jsonb, "backchannelLogoutUri" text, "backchannelLogoutSessionRequired" boolean, "tokenEndpointAuthMethod" text, "applicationType" text, "jwks" text, "jwksUri" text, "grantTypes" jsonb, "responseTypes" jsonb, "requirePKCE" boolean, "dpopBoundAccessTokens" boolean, "referenceId" text, "metadata" jsonb);

create table if not exists "oauthResource" ("id" text not null primary key, "identifier" text not null unique, "name" text not null, "accessTokenTtl" integer, "refreshTokenTtl" integer, "signingAlgorithm" text, "signingKeyId" text, "allowedScopes" jsonb, "customClaims" jsonb, "dpopBoundAccessTokensRequired" boolean, "disabled" boolean, "createdAt" timestamptz, "updatedAt" timestamptz, "policyVersion" integer, "metadata" jsonb);

create table if not exists "oauthClientResource" ("id" text not null primary key, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "resourceId" text not null references "oauthResource" ("identifier") on delete cascade, "metadata" jsonb, "createdAt" timestamptz);

create table if not exists "oauthRefreshToken" ("id" text not null primary key, "token" text not null unique, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "sessionId" text references "session" ("id") on delete set null, "userId" text not null references "user" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "revoked" timestamptz, "rotatedAt" timestamptz, "rotationReplayResponse" text, "rotationReplayExpiresAt" timestamptz, "authTime" timestamptz, "confirmation" jsonb, "scopes" jsonb not null);

create table if not exists "oauthAccessToken" ("id" text not null primary key, "token" text not null unique, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "sessionId" text references "session" ("id") on delete set null, "userId" text references "user" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "refreshId" text references "oauthRefreshToken" ("id") on delete cascade, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "revoked" timestamptz, "confirmation" jsonb, "scopes" jsonb not null);

create table if not exists "oauthConsent" ("id" text not null primary key, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "userId" text references "user" ("id") on delete cascade, "referenceId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "scopes" jsonb not null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null);

create table if not exists "oauthClientAssertion" ("id" text not null primary key, "expiresAt" timestamptz not null);

create index if not exists "session_userId_idx" on "session" ("userId");

create index if not exists "account_userId_idx" on "account" ("userId");

create index if not exists "verification_identifier_idx" on "verification" ("identifier");

create index if not exists "oauthClient_userId_idx" on "oauthClient" ("userId");

create index if not exists "oauthClientResource_clientId_idx" on "oauthClientResource" ("clientId");

create index if not exists "oauthClientResource_resourceId_idx" on "oauthClientResource" ("resourceId");

create index if not exists "oauthRefreshToken_clientId_idx" on "oauthRefreshToken" ("clientId");

create index if not exists "oauthRefreshToken_sessionId_idx" on "oauthRefreshToken" ("sessionId");

create index if not exists "oauthRefreshToken_userId_idx" on "oauthRefreshToken" ("userId");

create index if not exists "oauthRefreshToken_authorizationCodeId_idx" on "oauthRefreshToken" ("authorizationCodeId");

create index if not exists "oauthAccessToken_clientId_idx" on "oauthAccessToken" ("clientId");

create index if not exists "oauthAccessToken_sessionId_idx" on "oauthAccessToken" ("sessionId");

create index if not exists "oauthAccessToken_userId_idx" on "oauthAccessToken" ("userId");

create index if not exists "oauthAccessToken_authorizationCodeId_idx" on "oauthAccessToken" ("authorizationCodeId");

create index if not exists "oauthAccessToken_refreshId_idx" on "oauthAccessToken" ("refreshId");

create index if not exists "oauthConsent_clientId_idx" on "oauthConsent" ("clientId");

create index if not exists "oauthConsent_userId_idx" on "oauthConsent" ("userId");

create unique index if not exists "oauthClientResource_clientId_resourceId_uidx" on "oauthClientResource" ("clientId", "resourceId");

ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "jwks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oauthClient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oauthResource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oauthClientResource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oauthRefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oauthAccessToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oauthConsent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "oauthClientAssertion" ENABLE ROW LEVEL SECURITY;
COMMIT;
