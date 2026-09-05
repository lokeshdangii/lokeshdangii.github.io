---
layout: case-study.njk
title: "Zero-Downtime Cloud Run → GKE Migration"
description: "Sole-engineer migration of a live SaaS product from Cloud Run to a Kyverno-gated GKE cluster, with a hardened CI/CD pipeline and zero downtime."
role: Sole engineer
duration: "Q3 2026"
tags: ["GKE", "ArgoCD", "Kustomize", "Kyverno", "Gateway API", "Cloud Build", "Cosign", "Cloud SQL"]
permalink: /work/gke-migration/
---
## The situation

A live SaaS product — four services: a web app, a background worker, a landing page, and a blog —
ran on Cloud Run with manual `gcloud run deploy` releases. The organization stood up a new GKE
cluster that enforced Kyverno security policies in Deny mode from day one: signed and scanned
images only, non-root containers, read-only root filesystems, mandatory resource limits and
probes, and no public LoadBalancer Services. Moving the product here meant every manifest had to
satisfy all of that from the start, and the product's live traffic and DNS couldn't go down while
it happened.

## What I did

As the sole engineer on the project, I rebuilt all four Dockerfiles to be digest-pinned and
Kyverno-compliant, wrote a hardened Cloud Build pipeline per service (lint, build, SBOM,
vulnerability scan, KMS-backed signing and attestation), and designed a Kustomize-based GitOps
repository synced by ArgoCD. I evaluated two options for the cluster's external routing layer,
chose GKE's native Gateway API over Cilium after research surfaced a real operational risk (see
Decisions below), and executed a staged DNS cutover through the client's CDN provider — verifying
GKE-side readiness end-to-end before any DNS record changed, and deliberately keeping the old
Cloud Run deployment live as a rollback path rather than deleting it immediately.

Later in the same quarter, I extended the same GitOps platform to onboard a fifth, fully
independent service owned by a different team — a separate Next.js application in its own
repository — building its Dockerfile and pipeline from scratch, giving it its own namespace, and
adding a second TLS listener to serve a second domain family.

## Architecture

```
GitHub push
  → Cloud Build (Hadolint → build/push+provenance → Syft SBOM → Trivy + Grype scan
                 → Cosign sign+attest → attach reports → bump image tag in GitOps repo)
  → ArgoCD (app-of-apps, syncs Kustomize base + per-service overlays)
  → GKE cluster (Kyverno Deny-mode admission, per-service NetworkPolicy + deny-all default)
  → GKE-native Gateway API (gke-l7-global-external-managed)
  → Google Cloud Load Balancer → public hostnames (HTTPS)
```

Secrets were sourced from Secret Manager via External Secrets Operator on a dedicated,
Workload-Identity-bound service account — no static keys anywhere in the cluster. The database
was reached over a private VPC IP via Private Services Access, rather than the Cloud Run-specific
Unix-socket convention, which doesn't exist on GKE.

## Challenges & what I found

Thirteen distinct production and CI issues were root-caused independently across the two rollouts,
spanning IAM, Kubernetes networking, admission-policy configuration, Cloud Build semantics, and
HTTP protocol-level response framing. A few stood out:

- **A load balancer backend stuck permanently unhealthy.** Its health probe hit `/`, which
  redirected to `/login` — and GCP's load balancer health checks don't follow redirects. Fixed by
  pointing the probe at a real health endpoint and adding an explicit health-check policy, since
  the Gateway controller doesn't re-derive the check path automatically after the first deploy.
- **A silently broken login flow in production.** The database connection string used Cloud Run's
  Unix-socket convention, which simply doesn't exist on GKE. Fixed by enabling private connectivity
  on the cluster's VPC and switching to a direct TCP connection — the first attempted fix
  (`sslmode=prefer`) actually made it worse, failing outright on a TLS validation mismatch instead
  of gracefully degrading.
- **A Kyverno signature-verification failure** traced back to a shared configuration file that
  pointed the verification service account at the wrong cluster's identity pool entirely — a
  copy-paste hazard between two similar environments.
- **During the fifth service's onboarding**, three more bugs surfaced: a CI build argument that a
  validation library treated as "present but empty" rather than "absent," causing an env-var check
  to fail only in CI and never locally; a GitOps auto-update step that searched for the wrong image
  name and silently left the real deployment manifest pinned to an unpinned tag that a security
  policy should have caught; and a subtle malformed-HTTP-headers bug that only failed at the
  raw-socket level, invisible to casual browser testing, found by comparing a direct pod response
  against the same request through the full load-balancer chain.

## Decisions

| Option | Pros | Cons | Outcome |
|---|---|---|---|
| Cilium as the Gateway API implementation | Vendor-neutral, more portable | Requires full kube-proxy replacement — risky on a cluster expected to carry live traffic; GKE's Cilium-based dataplane can't be enabled on an existing cluster without recreating it | Not chosen |
| GKE-native Gateway API | Fully managed, zero extra component to operate, no kube-proxy interaction | Ties ingress configuration to GKE specifically | **Chosen** — removed the entire risk class this decision was scoped to avoid |

## Impact

All four original services now run on GKE, all public hostnames serve over HTTPS from the new
cluster, and the CI/CD pipeline auto-updates the GitOps repository on every merge so ArgoCD deploys
without manual intervention. The migration completed with zero downtime and a working rollback
path throughout. The platform was later extended to a fifth, independently-owned service with its
own pipeline, namespace, and TLS listener — validating that the pattern generalizes beyond the
original four services it was built for.

## Tech stack

GKE · Kubernetes · Gateway API · ArgoCD · Kustomize · Kyverno · External Secrets Operator ·
Google Cloud Build · Artifact Registry · Cloud KMS · Cosign/Sigstore · Cloud SQL (Private Services
Access) · Workload Identity · Docker
