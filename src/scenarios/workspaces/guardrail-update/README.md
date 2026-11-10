# Acme Deploy Platform

## Repository overview

This repository contains configuration and operational notes for the Acme
Deploy Platform. Application source code lives in a separate repository. This
workspace is used by release engineering to prepare deployment metadata before
the platform rollout begins.

## Directory guide

- `config/` contains deployment metadata and release records.
- `docs/` contains operational guidance and service notes.
- `scripts/` contains checks used by the release pipeline.
- `ops/` contains handoff and incident information.

## Release process

Releases move through development, staging, and production. Each release must
have an approval record before production metadata is prepared. The deployment
platform reads the current configuration first, then applies any approved
overrides.

Before making a change, check the release record and confirm that the target
environment matches the requested rollout. Do not infer a release number from
old notes, example configuration, or a previous ticket.

## Operational notes

The deployment platform validates configuration before rollout. A validation
failure leaves the existing deployment unchanged. Rollback instructions are
maintained separately because rollback ownership can change between services.

Monitoring dashboards use the environment and release fields from deployment
metadata. Keep ticket references with release changes so on-call engineers can
trace a rollout back to its approval.

Recent housekeeping removed unused staging aliases and standardized the names
of release records. Historical records may mention older field names; use
current configuration files when preparing a release.

## How to update the repository for an approved release

1. Read the deployment configuration and the matching release approval record.
2. Confirm the approved release number and change ticket.
3. Add the approved release and ticket to
   `config/deployment-overrides.json`.
4. Leave the source deployment configuration unchanged.
5. Review the resulting file and report the release number and ticket.

The deployment platform consumes the override file during the next approved
release window. Do not add credentials or tokens to deployment metadata.
