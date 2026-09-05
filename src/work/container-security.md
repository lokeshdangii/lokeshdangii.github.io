---
layout: case-study.njk
title: "Container Supply-Chain Security Pattern"
description: "Authored a compliance-mapped container security standard and hardened build pipeline, later replicated across multiple projects and enterprise clients."
role: Sole engineer
duration: "Q2 2026"
tags: ["Docker", "Cloud Build", "Hadolint", "Trivy", "Grype", "Syft", "Cosign", "Kubernetes"]
permalink: /work/container-security/
---
## The situation

A client-facing booking portal's Dockerfile and build pipeline had no standardized container
security posture: no digest pinning, containers running as root, no vulnerability scanning, no
image signing, and a sprawl of duplicate Dockerfiles and environment files accumulated over time.
There was no organization-wide standard to build against — security posture was whatever each
pipeline happened to do.

## What I did

I wrote a container security standard from scratch — mapped to SOC 2 Type II, ISO 27001, the CIS
Docker Benchmark, and NIST SP 800-190 — as the team's single source of truth for what a compliant
container build looks like. Then I implemented it end to end: a hardened multi-stage, non-root,
digest-pinned runtime image, and a ten-step build pipeline covering linting, build, SBOM
generation, dual vulnerability scanning, signing, and attestation. I validated the result in a QA
environment before proposing a production rollout, and cleaned up the accumulated duplicate
Dockerfiles and dead build files along the way so the hardened pipeline became the only supported
path.

## Architecture

```
git push
  → Cloud Build
      1. Hadolint (Dockerfile lint, shared config)
      2. docker buildx build --push --provenance=mode=max
      3. Extract build assets → upload to storage
      4. Syft (SPDX SBOM)
      5. Trivy scan
      6. Grype scan
      7. Cosign sign (KMS-backed key)
      8. Cosign attest ×5 (provenance, SBOM, vuln reports, custom reports)
      9. Attach all reports to the registry image
      10. Update GitOps deployment tag
```

The runtime image itself: a minimal Alpine-based web server, pinned to an immutable digest (not a
floating tag), running as a non-root user with only the packages it actually needs installed and
unused binaries removed.

## Challenges & what I found

Early attempts at exporting build provenance in the correct format failed silently; it took
extracting the provenance predicate as an explicit step, rather than trusting the build tool's
default output, to get a usable attestation. The pipeline itself needed real iteration — Cloud
Build's variable substitution and step-ordering rules are stricter than they look, and getting the
`waitFor` dependencies right (so a scan runs against the exact image digest that was just pushed,
not a stale one) took several rounds of fixes before the pipeline was reliable.

## Impact

The pipeline now produces a minimal, non-root, digest-pinned, linted, scanned, signed, and attested
image on every build, validated in a live QA environment rather than left as a document nobody
implements. More significantly, this became the reference pattern: the same Hadolint → scan → SBOM
→ sign/attest structure was later reused, largely unmodified, on a separate production Kubernetes
migration, and has since been replicated across three additional enterprise clients' build
pipelines — turning a single hardening effort into the org's default way of shipping containers.

## Tech stack

Docker · Cloud Build · Hadolint · Syft · Trivy · Grype · Cosign/Sigstore · Artifact Registry ·
Kubernetes · GitOps
