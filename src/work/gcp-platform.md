---
layout: case-study.njk
title: "Enterprise GCP Infrastructure Platform"
description: "Led 4 of 11 Terraform modules on a platform that cut new enterprise client onboarding from days to minutes."
role: "Module lead, 4-person team"
duration: "Q4 2025 — ongoing"
tags: ["Terraform", "GCP", "VPC", "GKE", "Cloud SQL", "KMS", "IAM"]
permalink: /work/gcp-platform/
---
## The situation

Provisioning GCP infrastructure for a new enterprise client was a manual process, repeated from
scratch every time, taking two to three days per client. It produced inconsistent configurations
across environments and left compliance gaps that only surfaced later. There was no shared,
reusable codebase — every client onboarding was new engineering work.

## What I did

As part of a four-person DevOps team, I led four of the platform's eleven Terraform modules — VPC
networking, GKE, cloud storage, and the load balancer — end to end. Beyond module ownership, I
defined the repository-wide naming convention and mandatory labeling scheme that every module in
the platform applies, including the modules owned by teammates. The platform was built so that
onboarding a future client, or migrating an existing one onto a new GCP project, would require only
a new configuration file, not new module code.

## Architecture

Eleven independent modules, deployed in a fixed dependency order:

```
KMS (encryption keys)
  → VPC (networking, Cloud NAT, Private Service Access)
  → Fleet (optional multi-cluster)
  → GKE (private nodes, Workload Identity)
  → Cloud SQL / Redis (databases, cache)
  → GCS (encrypted object storage)
  → Load Balancer (global HTTPS ingress)
  → Compute (bastion/jumphost, OS Login + 2FA + auto-shutdown)
  → Service Accounts (least-privilege IAM)
```

Each environment (dev/QA/UAT/staging/prod) gets its own isolated Terraform state and configuration
file, so environments and clients never share resources. Configuration files are kept out of
version control entirely and managed through a dedicated sync script, treated as the single source
of truth.

## Impact

The platform cut new-client infrastructure setup from two to three days down to fifteen to thirty
minutes — roughly a 95% reduction — while achieving an estimated 75–85% CIS GCP Benchmark
compliance out of the box, up from an estimated 30–40% under the previous manual process. It
replaced ad hoc, per-client setup with a single, peer-reviewed codebase (46 merged pull requests)
and is live in production and UAT for an enterprise client today, with future client onboarding and
existing-client migrations designed to reuse the same modules by configuration alone.

## Tech stack

Terraform · GCP VPC · GKE · Cloud SQL · Memorystore for Redis · Cloud KMS · Cloud Storage ·
Pub/Sub · HTTP(S) Load Balancing · Compute Engine · IAM
