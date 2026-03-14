# Baltzer TCG Index Migration Hold

This workload is intentionally demoted from the live AI-Enterprise operational surface.

## Why

- the duplicated payload depended on an external datastore that is no longer allowed in the clean target
- no local replacement has been implemented yet
- AI-Enterprise must stay operational without this dependency

## Current Contract

- keep the program ID `baltzer-tcg-index`
- keep the application ID `baltzer-tcg-index-app`
- expose the workload as `planned` in registry and dashboard views
- do not require any third-party datastore secret to run AI-Enterprise

## Replacement Path

1. design the local datastore schema and retention model
2. rebuild ingestion and pricing jobs against that local store
3. restore active status only after end-to-end validation passes
